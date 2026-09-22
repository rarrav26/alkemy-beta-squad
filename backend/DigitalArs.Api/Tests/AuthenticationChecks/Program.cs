using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Configuration;
using DigitalArs.Api.Helpers.Domain;
using DigitalArs.Api.Helpers.Results;
using DigitalArs.Api.Interfaces;
using DigitalArs.Api.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
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

var settings = new JwtOptions { Key = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)),
    Issuer = "DigitalArs.Api", Audience = "DigitalArs.Frontend", ExpirationMinutes = 60 };
var service = new JwtTokenService(Options.Create(settings), users);

// AuthService solo depende de Identity, del repositorio de perfiles y del emisor de tokens, así
// que se lo puede ejercitar entero en memoria: no hace falta SQL Server para estas pruebas.
var perfiles = new PerfilesEnMemoria();
var authService = new AuthService(users, perfiles, service);

var user = new IdentityUser { UserName = "test@example.com", Email = "test@example.com" };
Check((await users.CreateAsync(user)).Succeeded, "Identity crea un usuario sin contraseña");
Check(!await users.HasPasswordAsync(user), "La invitación no define una contraseña");
perfiles.Agregar(user.Id, "test@example.com");

// Se emite igual que AccountService, con el mismo propósito compartido: si ese propósito
// cambiara de un lado solo, esta prueba lo detecta.
var invitation = await CrearInvitacion(user);
Check(!(await DefinirPassword("test@example.com", invitation + "invalid", "Secure123!")).Exitoso, "Rechaza invitación adulterada");
var other = new IdentityUser { UserName = "other@example.com", Email = "other@example.com" };
await users.CreateAsync(other);
perfiles.Agregar(other.Id, "other@example.com");
Check(!(await DefinirPassword("other@example.com", invitation, "Secure123!")).Exitoso, "Invitación vinculada al usuario");
Check(!(await DefinirPassword("test@example.com", invitation, "abc")).Exitoso, "Rechaza contraseña débil");
Check((await DefinirPassword("test@example.com", invitation, "Secure123!")).Exitoso, "Establece primera contraseña");
Check(user.PasswordHash != "Secure123!" && !string.IsNullOrEmpty(user.PasswordHash), "Guarda hash, nunca texto plano");
Check(await users.CheckPasswordAsync(user, "Secure123!"), "Identity valida contraseña correcta");
Check(!await users.CheckPasswordAsync(user, "Incorrect123!"), "Identity rechaza contraseña incorrecta");
Check(!(await DefinirPassword("test@example.com", invitation, "NewSecure123!")).Exitoso, "Invitación de un solo uso");
var oldInvitation = await CrearInvitacion(other);
await users.UpdateSecurityStampAsync(other);
Check(!(await DefinirPassword("other@example.com", oldInvitation, "Secure123!")).Exitoso, "Renovar stamp revoca invitaciones anteriores");
var expiredProvider = new DataProtectorTokenProvider<IdentityUser>(
    provider.GetRequiredService<IDataProtectionProvider>(),
    Options.Create(new DataProtectionTokenProviderOptions { TokenLifespan = TimeSpan.FromSeconds(-1) }),
    provider.GetRequiredService<ILogger<DataProtectorTokenProvider<IdentityUser>>>());
var fresh = await CrearInvitacion(other);
Check(!await expiredProvider.ValidateAsync(Invitacion.Proposito, fresh, users, other), "Invitación vencida rechazada");

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

// Criterio 1 (HU-010): el destino de una transferencia se resuelve desde un único campo,
// aceptando un alias (3 palabras separadas por punto) o un CVU (22 dígitos). El formato se
// valida antes de tocar la base, con DatosDeCuenta como única fuente de verdad.
Check(DatosDeCuenta.EsDestinoValido("auto.perro.gato"), "Acepta alias de 3 palabras");
Check(DatosDeCuenta.EsDestinoValido(DatosDeCuenta.SortearAlias()), "Acepta un alias generado por el sistema");
Check(DatosDeCuenta.EsDestinoValido("0000003100000012345678"), "Acepta CVU de 22 dígitos");
Check(DatosDeCuenta.EsDestinoValido(DatosDeCuenta.CvuPara(42)), "Acepta un CVU generado por el sistema");
Check(!DatosDeCuenta.EsDestinoValido("auto.perro"), "Rechaza alias de solo 2 palabras");
Check(!DatosDeCuenta.EsDestinoValido("auto.perro.gato.sol"), "Rechaza alias de 4 palabras");
Check(!DatosDeCuenta.EsDestinoValido("autoperrogato"), "Rechaza alias sin puntos");
Check(!DatosDeCuenta.EsDestinoValido("00000031000000123456"), "Rechaza CVU de menos de 22 dígitos");
Check(!DatosDeCuenta.EsDestinoValido("000000310000001234567X"), "Rechaza CVU con caracteres no numéricos");
Check(!DatosDeCuenta.EsDestinoValido(""), "Rechaza destino vacío");
Check(!DatosDeCuenta.EsDestinoValido(null), "Rechaza destino nulo");

Console.WriteLine("Todas las verificaciones pasaron.");

Task<string> CrearInvitacion(IdentityUser usuario) =>
    users.GenerateUserTokenAsync(usuario, TokenOptions.DefaultProvider, Invitacion.Proposito);

Task<Resultado<SesionResponse>> DefinirPassword(string email, string token, string password) =>
    authService.DefinirPrimeraPasswordAsync(new PrimeraPasswordDto
    {
        Email = email, InvitationToken = token, Password = password, ConfirmPassword = password
    });

void Check(bool condition, string name) { if (!condition) throw new Exception(name); Console.WriteLine("PASS: " + name); }
void Reject(string token, TokenValidationParameters validation, string name)
{
    try { handler.ValidateToken(token, validation, out _); }
    catch (SecurityTokenException) { Check(true, name); return; }
    catch (ArgumentException) { Check(true, name); return; }
    throw new Exception(name);
}

// Perfiles de negocio en memoria, para no necesitar SQL Server.
sealed class PerfilesEnMemoria : IUsuarioRepository
{
    private readonly List<Usuario> items = [];

    public void Agregar(string identityUserId, string email) =>
        items.Add(new Usuario
        {
            id = items.Count + 1,
            identity_user_id = identityUserId,
            nombre = "Prueba", apellido = "Prueba", email = email,
            tipo_documento = "DNI", nro_documento = "90000001",
            is_active = true
        });

    public Task<Usuario?> GetByIdAsync(int id, CancellationToken c = default) =>
        Task.FromResult(items.FirstOrDefault(u => u.id == id));

    public Task<Usuario?> GetByIdentityUserIdAsync(string identityUserId, CancellationToken c = default) =>
        Task.FromResult(items.FirstOrDefault(u => u.identity_user_id == identityUserId));

    public Task<bool> ActualizarEstadoActivoAsync(int id, bool activo, CancellationToken c = default)
    {
        var perfil = items.FirstOrDefault(u => u.id == id);
        if (perfil is null) return Task.FromResult(false);

        perfil.is_active = activo;
        return Task.FromResult(true);
    }
}

sealed class MemoryStore : IUserPasswordStore<IdentityUser>, IUserSecurityStampStore<IdentityUser>,
    IUserRoleStore<IdentityUser>, IUserEmailStore<IdentityUser>
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
    public Task SetEmailAsync(IdentityUser u, string? s, CancellationToken c) { u.Email=s; return Task.CompletedTask; }
    public Task<string?> GetEmailAsync(IdentityUser u, CancellationToken c) => Task.FromResult(u.Email);
    public Task<bool> GetEmailConfirmedAsync(IdentityUser u, CancellationToken c) => Task.FromResult(u.EmailConfirmed);
    public Task SetEmailConfirmedAsync(IdentityUser u, bool b, CancellationToken c) { u.EmailConfirmed=b; return Task.CompletedTask; }
    public Task<IdentityUser?> FindByEmailAsync(string normalizedEmail, CancellationToken c) => Task.FromResult(items.Values.FirstOrDefault(u => u.NormalizedEmail == normalizedEmail));
    public Task<string?> GetNormalizedEmailAsync(IdentityUser u, CancellationToken c) => Task.FromResult(u.NormalizedEmail);
    public Task SetNormalizedEmailAsync(IdentityUser u, string? s, CancellationToken c) { u.NormalizedEmail=s; return Task.CompletedTask; }
}
