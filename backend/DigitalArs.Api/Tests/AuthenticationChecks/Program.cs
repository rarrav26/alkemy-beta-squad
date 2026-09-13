using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

var services = new ServiceCollection();
services.AddLogging();
services.AddSingleton<IDataProtectionProvider>(new EphemeralDataProtectionProvider());
services.AddIdentityCore<IdentityUser>().AddUserStore<MemoryStore>().AddDefaultTokenProviders();
using var provider = services.BuildServiceProvider();
var users = provider.GetRequiredService<UserManager<IdentityUser>>();
using var auth = new AuthDbContext(new DbContextOptionsBuilder<AuthDbContext>().UseSqlServer("Server=unused;Database=unused").Options);
using var db = new DigitalArsDbContext(new DbContextOptionsBuilder<DigitalArsDbContext>().UseSqlServer("Server=unused;Database=unused").Options);
var accounts = new AccountService(auth, db, users);
var user = new IdentityUser { UserName = "test@example.com", Email = "test@example.com" };
Check((await users.CreateAsync(user)).Succeeded, "Identity crea un usuario sin contraseña");
Check(!await users.HasPasswordAsync(user), "La invitación no define una contraseña");
var invitation = await accounts.CreateInvitationAsync(user);
Check(!(await accounts.SetInitialPasswordAsync(user, invitation + "invalid", "Secure123!")).Succeeded, "Rechaza invitación adulterada");
var other = new IdentityUser { UserName = "other@example.com", Email = "other@example.com" };
await users.CreateAsync(other);
Check(!(await accounts.SetInitialPasswordAsync(other, invitation, "Secure123!")).Succeeded, "Invitación vinculada al usuario");
Check(!(await accounts.SetInitialPasswordAsync(user, invitation, "abc")).Succeeded, "Rechaza contraseña débil");
Check((await accounts.SetInitialPasswordAsync(user, invitation, "Secure123!")).Succeeded, "Establece primera contraseña");
Check(user.PasswordHash != "Secure123!" && !string.IsNullOrEmpty(user.PasswordHash), "Guarda hash, nunca texto plano");
Check(await users.CheckPasswordAsync(user, "Secure123!"), "Identity valida contraseña correcta");
Check(!await users.CheckPasswordAsync(user, "Incorrect123!"), "Identity rechaza contraseña incorrecta");
Check(!(await accounts.SetInitialPasswordAsync(user, invitation, "NewSecure123!")).Succeeded, "Invitación de un solo uso");
var oldInvitation = await accounts.CreateInvitationAsync(other);
await users.UpdateSecurityStampAsync(other);
Check(!(await accounts.SetInitialPasswordAsync(other, oldInvitation, "Secure123!")).Succeeded, "Renovar stamp revoca invitaciones anteriores");
var expiredProvider = new DataProtectorTokenProvider<IdentityUser>(
    provider.GetRequiredService<IDataProtectionProvider>(),
    Options.Create(new DataProtectionTokenProviderOptions { TokenLifespan = TimeSpan.FromSeconds(-1) }),
    provider.GetRequiredService<ILogger<DataProtectorTokenProvider<IdentityUser>>>());
var fresh = await accounts.CreateInvitationAsync(other);
Check(!await expiredProvider.ValidateAsync(AccountService.InitialPasswordPurpose, fresh, users, other), "Invitación vencida rechazada");

var settings = new JwtOptions { Key = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)),
    Issuer = "DigitalArs.Api", Audience = "DigitalArs.Frontend", ExpirationMinutes = 60 };
var service = new JwtTokenService(Options.Create(settings), users);
var response = await service.CrearToken(user, 42);
var parameters = new TokenValidationParameters
{
    ValidIssuer = settings.Issuer, ValidAudience = settings.Audience,
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Key)),
    ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true,
    ValidateIssuerSigningKey = true, ClockSkew = TimeSpan.Zero, ValidAlgorithms = [SecurityAlgorithms.HmacSha256]
};
var handler = new JwtSecurityTokenHandler();
var principal = handler.ValidateToken(response.Token, parameters, out _);
Check(principal.FindFirstValue(ClaimTypes.NameIdentifier) == user.Id &&
      principal.FindFirstValue("usuarioId") == "42" && principal.IsInRole("Usuario"), "JWT contiene identidad, perfil y rol");
Check(principal.FindFirstValue("security_stamp") == user.SecurityStamp, "JWT permite revocar acceso por stamp");
var badIssuer = parameters.Clone(); badIssuer.ValidIssuer = "another";
Reject(response.Token, badIssuer, "Rechaza emisor incorrecto");
var badAudience = parameters.Clone(); badAudience.ValidAudience = "another";
Reject(response.Token, badAudience, "Rechaza audiencia incorrecta");
var badKey = parameters.Clone(); badKey.IssuerSigningKey = new SymmetricSecurityKey(new byte[32]);
Reject(response.Token, badKey, "Rechaza firma incorrecta");
var expired = new JwtSecurityToken(settings.Issuer, settings.Audience, expires: DateTime.UtcNow.AddMinutes(-1),
    signingCredentials: new SigningCredentials(parameters.IssuerSigningKey, SecurityAlgorithms.HmacSha256));
Reject(handler.WriteToken(expired), parameters, "Rechaza JWT vencido");
Reject(invitation, parameters, "Invitación no puede usarse como JWT");
Console.WriteLine("Todas las verificaciones pasaron.");
void Check(bool condition, string name) { if (!condition) throw new Exception(name); Console.WriteLine("PASS: " + name); }
void Reject(string token, TokenValidationParameters validation, string name)
{
    try { handler.ValidateToken(token, validation, out _); }
    catch (SecurityTokenException) { Check(true, name); return; }
    catch (ArgumentException) { Check(true, name); return; }
    throw new Exception(name);
}

sealed class MemoryStore : IUserPasswordStore<IdentityUser>, IUserSecurityStampStore<IdentityUser>, IUserRoleStore<IdentityUser>
{
    private readonly Dictionary<string, IdentityUser> items = new();
    public void Dispose() { }
    public Task<IdentityResult> CreateAsync(IdentityUser u, CancellationToken c) { items[u.Id]=u; return Task.FromResult(IdentityResult.Success); }
    public Task<IdentityResult> UpdateAsync(IdentityUser u, CancellationToken c) { items[u.Id]=u; return Task.FromResult(IdentityResult.Success); }
    public Task<IdentityResult> DeleteAsync(IdentityUser u, CancellationToken c) { items.Remove(u.Id); return Task.FromResult(IdentityResult.Success); }
    public Task<IdentityUser?> FindByIdAsync(string id, CancellationToken c) => Task.FromResult(items.GetValueOrDefault(id));
    public Task<IdentityUser?> FindByNameAsync(string name, CancellationToken c) => Task.FromResult(items.Values.FirstOrDefault(u => u.NormalizedUserName == name));
    public Task<string> GetUserIdAsync(IdentityUser u, CancellationToken c) => Task.FromResult(u.Id);
    public Task<string?> GetUserNameAsync(IdentityUser u, CancellationToken c) => Task.FromResult(u.UserName);
    public Task SetUserNameAsync(IdentityUser u, string? s, CancellationToken c) { u.UserName=s; return Task.CompletedTask; }
    public Task<string?> GetNormalizedUserNameAsync(IdentityUser u, CancellationToken c) => Task.FromResult(u.NormalizedUserName);
    public Task SetNormalizedUserNameAsync(IdentityUser u, string? s, CancellationToken c) { u.NormalizedUserName=s; return Task.CompletedTask; }
    public Task SetPasswordHashAsync(IdentityUser u, string? s, CancellationToken c) { u.PasswordHash=s; return Task.CompletedTask; }
    public Task<string?> GetPasswordHashAsync(IdentityUser u, CancellationToken c) => Task.FromResult(u.PasswordHash);
    public Task<bool> HasPasswordAsync(IdentityUser u, CancellationToken c) => Task.FromResult(u.PasswordHash is not null);
    public Task SetSecurityStampAsync(IdentityUser u, string s, CancellationToken c) { u.SecurityStamp=s; return Task.CompletedTask; }
    public Task<string?> GetSecurityStampAsync(IdentityUser u, CancellationToken c) => Task.FromResult(u.SecurityStamp);
    public Task<IList<string>> GetRolesAsync(IdentityUser u, CancellationToken c) => Task.FromResult<IList<string>>(["Usuario"]);
    public Task AddToRoleAsync(IdentityUser u, string s, CancellationToken c) => throw new NotSupportedException();
    public Task RemoveFromRoleAsync(IdentityUser u, string s, CancellationToken c) => throw new NotSupportedException();
    public Task<bool> IsInRoleAsync(IdentityUser u, string s, CancellationToken c) => Task.FromResult(s == "Usuario");
    public Task<IList<IdentityUser>> GetUsersInRoleAsync(string s, CancellationToken c) => Task.FromResult<IList<IdentityUser>>(items.Values.ToList());
}