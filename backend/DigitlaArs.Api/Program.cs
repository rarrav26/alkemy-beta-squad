using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Interfaces;
using DigitalArs.Api.OpenApi;
using DigitalArs.Api.Repositories;
using DigitalArs.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var commandFlags = new[] { "--identity-script", "--init-identity", "--bootstrap-admin", "--seed" };
var builder = WebApplication.CreateBuilder(args.Where(a => !commandFlags.Contains(a)).ToArray());
DevelopmentSetup.ConfigureJwt(builder);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Falta la cadena de conexión. Copiá Properties/launchSettings.Example.json a " +
        "Properties/launchSettings.json y completá ConnectionStrings__DefaultConnection " +
        "con tu instancia de SQL Server. Ver README.md del backend.");
}

builder.Services.AddScoped(_ => new SqlConnection(connectionString));
builder.Services.AddDbContext<DigitalArsDbContext>((sp, options) =>
    options.UseSqlServer(sp.GetRequiredService<SqlConnection>()));
builder.Services.AddDbContext<AuthDbContext>((sp, options) =>
    options.UseSqlServer(sp.GetRequiredService<SqlConnection>()));
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddIdentityCore<IdentityUser>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.Password.RequiredLength = 8;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
}).AddRoles<IdentityRole>().AddEntityFrameworkStores<AuthDbContext>().AddDefaultTokenProviders();
builder.Services.Configure<DataProtectionTokenProviderOptions>(options => options.TokenLifespan = TimeSpan.FromDays(1));
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddOptions<JwtOptions>().BindConfiguration("Jwt").ValidateDataAnnotations()
    .Validate(o => Encoding.UTF8.GetByteCount(o.Key) >= 32, "Jwt:Key debe tener al menos 32 bytes.")
    .ValidateOnStart();
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = jwt.Issuer,
        ValidateAudience = true, ValidAudience = jwt.Audience,
        ValidateLifetime = true, RequireExpirationTime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            string.IsNullOrEmpty(jwt.Key) ? "missing-key-validation-will-fail-on-start" : jwt.Key)),
        ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var users = context.HttpContext.RequestServices.GetRequiredService<UserManager<IdentityUser>>();
            var db = context.HttpContext.RequestServices.GetRequiredService<DigitalArsDbContext>();
            var id = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = id is null ? null : await users.FindByIdAsync(id);
            if (user is null || !await users.HasPasswordAsync(user) ||
                context.Principal?.FindFirstValue("security_stamp") != await users.GetSecurityStampAsync(user) ||
                !await db.Usuarios.AnyAsync(u => u.identity_user_id == id && u.is_active))
                context.Fail("Token inválido o usuario desactivado.");
        }
    };
});
builder.Services.AddAuthorization(options =>
    options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
builder.Services.AddControllers();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
{
    var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? (builder.Environment.IsDevelopment() ? ["http://localhost:5173"] : Array.Empty<string>());
    if (origins.Length > 0) policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
}));
builder.Services.AddOpenApi(options => options.AddDocumentTransformer<BearerSecuritySchemeTransformer>());

var app = builder.Build();
if (args.Contains("--identity-script"))
{
    using var scope = app.Services.CreateScope();
    Console.WriteLine(scope.ServiceProvider.GetRequiredService<AuthDbContext>().Database.GenerateCreateScript());
    return;
}
if (args.Contains("--bootstrap-admin") || args.Contains("--seed"))
{
    using var scope = app.Services.CreateScope();
    await DevelopmentSetup.InitializeIdentityAsync(scope.ServiceProvider);
    await DatabaseSeeder.SeedAsync(scope.ServiceProvider, builder.Configuration);
    Console.WriteLine("Seed completo: roles, catálogo y administrador preparados.");
    return;
}
if (args.Contains("--init-identity"))
{
    using var scope = app.Services.CreateScope();
    await DevelopmentSetup.InitializeIdentityAsync(scope.ServiceProvider);
    Console.WriteLine("Tablas de Identity y roles preparados.");
    return;
}
_ = app.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<JwtOptions>>().Value;
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DigitalArsDbContext>();
    if (!await db.Database.CanConnectAsync())
        throw new InvalidOperationException("No fue posible conectar con SQL Server. Revisá DefaultConnection y el servicio SQL Server.");
    if (app.Environment.IsDevelopment())
        await DevelopmentSetup.InitializeIdentityAsync(scope.ServiceProvider);
    else
        await IdentitySetup.EnsureRolesAsync(scope.ServiceProvider);
    await DatabaseSeeder.SeedAsync(scope.ServiceProvider, builder.Configuration);
}
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "DigitalArs.Api v1"));
}
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.Run();

public partial class Program { }
