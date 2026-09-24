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
Check(!principal.IsInRole(RolPrincipal.Administrador), "Un JWT de Usuario no trae el rol Administrador");
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
// aceptando un alias o un CVU (22 dígitos). El formato se valida antes de tocar la base, con
// DatosDeCuenta como única fuente de verdad.
// El alias tiene DOS formatos válidos y conviene no confundirlos: el AUTOGENERADO al crear la
// cuenta son 3 palabras separadas por punto, y el PERSONALIZADO que el usuario elige al editar
// es solo letras. Como destino sirven los dos, porque en la base conviven.

// --- Alias autogenerado: 3 palabras con punto ---
Check(DatosDeCuenta.EsAliasGeneradoValido("auto.perro.gato"), "Alias generado: acepta 3 palabras con punto");
Check(DatosDeCuenta.EsAliasGeneradoValido(DatosDeCuenta.SortearAlias()), "Alias generado: acepta lo que produce SortearAlias");
Check(!DatosDeCuenta.EsAliasGeneradoValido("mariagonzalez"), "Alias generado: rechaza una sola palabra");
Check(!DatosDeCuenta.EsAliasGeneradoValido("auto.perro"), "Alias generado: rechaza 2 palabras");

// --- Alias personalizado: solo letras ---
Check(DatosDeCuenta.EsAliasPersonalizadoValido("mariagonzalez"), "Alias personalizado: acepta solo letras");
Check(!DatosDeCuenta.EsAliasPersonalizadoValido("auto.perro.gato"), "Alias personalizado: rechaza puntos");
Check(!DatosDeCuenta.EsAliasPersonalizadoValido("maria123"), "Alias personalizado: rechaza números");
Check(!DatosDeCuenta.EsAliasPersonalizadoValido("maria gonzalez"), "Alias personalizado: rechaza espacios");
Check(!DatosDeCuenta.EsAliasPersonalizadoValido("ab"), "Alias personalizado: rechaza menos del largo mínimo");
Check(!DatosDeCuenta.EsAliasPersonalizadoValido(new string('a', DatosDeCuenta.LargoMaximoAlias + 1)), "Alias personalizado: rechaza pasarse del largo máximo");
Check(DatosDeCuenta.EsAliasPersonalizadoValido(DatosDeCuenta.NormalizarAlias("MariaGonzalez")), "Alias personalizado: acepta mayúsculas una vez normalizado");
Check(DatosDeCuenta.NormalizarAlias("  MariaGonzalez  ") == "mariagonzalez", "Normaliza recortando espacios y pasando a minúsculas");

// --- Como destino de transferencia valen AMBOS formatos ---
Check(DatosDeCuenta.EsDestinoValido("auto.perro.gato"), "Destino: acepta el alias autogenerado");
Check(DatosDeCuenta.EsDestinoValido("mariagonzalez"), "Destino: acepta el alias personalizado");
Check(DatosDeCuenta.EsDestinoValido("0000003100000012345678"), "Destino: acepta CVU de 22 dígitos");
Check(DatosDeCuenta.EsDestinoValido(DatosDeCuenta.CvuPara(42)), "Destino: acepta un CVU generado por el sistema");
Check(!DatosDeCuenta.EsDestinoValido("auto.perro"), "Destino: rechaza un alias de 2 palabras");
Check(!DatosDeCuenta.EsDestinoValido("00000031000000123456"), "Destino: rechaza CVU de menos de 22 dígitos");
Check(!DatosDeCuenta.EsDestinoValido("000000310000001234567X"), "Destino: rechaza CVU con caracteres no numéricos");
Check(!DatosDeCuenta.EsDestinoValido(""), "Destino: rechaza vacío");
Check(!DatosDeCuenta.EsDestinoValido(null), "Destino: rechaza nulo");

// ==========================================================================================
// TARJETAS
// ==========================================================================================

// --- Número: forma y dígito verificador de Luhn ---
// Se sortean varios porque la generación es aleatoria: uno solo podría pasar por casualidad.
for (var intento = 0; intento < 200; intento++)
{
    var sorteado = DatosDeTarjeta.SortearNumero();

    if (sorteado.Length != DatosDeTarjeta.LargoNumero)
        throw new Exception("Número de tarjeta: largo incorrecto -> " + sorteado);

    if (!sorteado.StartsWith(DatosDeTarjeta.PrefijoEmisor))
        throw new Exception("Número de tarjeta: prefijo incorrecto -> " + sorteado);

    if (!sorteado.All(char.IsAsciiDigit))
        throw new Exception("Número de tarjeta: tiene caracteres que no son dígitos -> " + sorteado);

    if (!DatosDeTarjeta.EsNumeroValido(sorteado))
        throw new Exception("Número de tarjeta: no pasa Luhn -> " + sorteado);
}
Console.WriteLine("PASS: Número de tarjeta: 200 sorteos con largo, prefijo y Luhn válidos");

// Dos sorteos seguidos tienen que dar distinto: si dieran siempre lo mismo, el número sería
// en la práctica derivado de la cuenta y chocaría con UQ_Tarjetas_Numero al regenerar.
Check(DatosDeTarjeta.SortearNumero() != DatosDeTarjeta.SortearNumero(),
    "Número de tarjeta: dos sorteos dan números distintos");

// Luhn contra un número de prueba público conocido (el de la documentación de Visa).
Check(DatosDeTarjeta.EsNumeroValido("4111111111111111"),
    "Luhn: acepta el número de prueba conocido de Visa");
Check(!DatosDeTarjeta.EsNumeroValido("4111111111111112"),
    "Luhn: rechaza ese mismo número con el último dígito cambiado");
Check(!DatosDeTarjeta.EsNumeroValido("4000123456789012"),
    "Luhn: rechaza un número de 16 dígitos con verificador incorrecto");
Check(!DatosDeTarjeta.EsNumeroValido("400011111111111"),
    "Luhn: rechaza 15 dígitos");
Check(!DatosDeTarjeta.EsNumeroValido("41111111111111111"),
    "Luhn: rechaza 17 dígitos");
Check(!DatosDeTarjeta.EsNumeroValido("4111-1111-1111-1111"),
    "Luhn: rechaza el número con guiones");
Check(!DatosDeTarjeta.EsNumeroValido(""), "Luhn: rechaza vacío");
Check(!DatosDeTarjeta.EsNumeroValido(null), "Luhn: rechaza nulo");

// El verificador tiene que ser un solo dígito, y agregárselo al cuerpo tiene que dar un
// número válido. Se prueba con un cuerpo de 15 dígitos, que es lo que recibe en producción.
var cuerpoDePrueba = "400011112222333";
var verificador = DatosDeTarjeta.DigitoVerificador(cuerpoDePrueba);
Check(verificador is >= 0 and <= 9, "Dígito verificador: es un solo dígito");
Check(DatosDeTarjeta.EsNumeroValido(cuerpoDePrueba + verificador),
    "Dígito verificador: el número queda válido al agregarlo");

// --- Vencimiento ---
// Fecha fija para que el chequeo no dependa del día en que se corre.
var hoyDePrueba = new DateOnly(2026, 9, 23);
var vence = DatosDeTarjeta.VencimientoDesde(hoyDePrueba);
Check(vence.Year == 2029, "Vencimiento: suma 3 años");
Check(vence.Month == 9, "Vencimiento: conserva el mes");
Check(vence.Day == 30, "Vencimiento: cae el último día del mes (septiembre tiene 30)");

// Febrero es el caso que rompe si se asume que todos los meses tienen 30 o 31 días.
Check(DatosDeTarjeta.VencimientoDesde(new DateOnly(2026, 2, 10)).Day == 28,
    "Vencimiento: febrero no bisiesto cae el 28");
Check(DatosDeTarjeta.VencimientoDesde(new DateOnly(2029, 2, 10)).Day == 29,
    "Vencimiento: febrero bisiesto cae el 29");

// El último día del mes todavía NO está vencida: por eso se guarda el último día y no el 1.
Check(!DatosDeTarjeta.EstaVencida(vence, vence),
    "Vencimiento: el último día de vigencia no está vencida");
Check(DatosDeTarjeta.EstaVencida(vence, vence.AddDays(1)),
    "Vencimiento: al día siguiente sí está vencida");
Check(!DatosDeTarjeta.EstaVencida(vence, hoyDePrueba),
    "Vencimiento: una tarjeta recién generada no está vencida");

// --- Código de seguridad ---
// Se sortean muchos para que salgan los casos con ceros adelante, que son los que se
// pierden si se formatea mal.
for (var intento = 0; intento < 500; intento++)
{
    var codigo = DatosDeTarjeta.SortearCodigoDeSeguridad();

    if (codigo.Length != 3)
        throw new Exception("Código de seguridad: no tiene 3 dígitos -> " + codigo);

    if (!codigo.All(char.IsAsciiDigit))
        throw new Exception("Código de seguridad: tiene caracteres que no son dígitos -> " + codigo);
}
Console.WriteLine("PASS: Código de seguridad: 500 sorteos de 3 dígitos, ceros adelante incluidos");

// --- Enmascarado: nunca puede dejar salir el número completo ---
Check(DatosDeTarjeta.UltimosCuatro("4000111122223333") == "3333",
    "Enmascarado: devuelve los últimos 4 dígitos");
Check(DatosDeTarjeta.UltimosCuatro("4000111122223333").Length == 4,
    "Enmascarado: devuelve exactamente 4 dígitos y no el número entero");

// --- Estados y transiciones ---
Check(EstadoDeTarjeta.EsEstadoConocido(EstadoDeTarjeta.Activa), "Estado: ACTIVA es conocido");
Check(EstadoDeTarjeta.EsEstadoConocido(EstadoDeTarjeta.Congelada), "Estado: CONGELADA es conocido");
Check(EstadoDeTarjeta.EsEstadoConocido(EstadoDeTarjeta.DadaDeBaja), "Estado: DADA_DE_BAJA es conocido");
Check(!EstadoDeTarjeta.EsEstadoConocido("VENCIDA"), "Estado: rechaza un estado inventado");
Check(!EstadoDeTarjeta.EsEstadoConocido(null), "Estado: rechaza nulo");

// Vigente = ocupa el lugar de la única tarjeta de la cuenta. Tiene que decir lo mismo que el
// filtro del índice UQ_Tarjetas_CuentaVigente.
Check(EstadoDeTarjeta.EsVigente(EstadoDeTarjeta.Activa), "Vigente: la activa ocupa el lugar");
Check(EstadoDeTarjeta.EsVigente(EstadoDeTarjeta.Congelada), "Vigente: la CONGELADA también ocupa el lugar");
Check(!EstadoDeTarjeta.EsVigente(EstadoDeTarjeta.DadaDeBaja), "Vigente: la dada de baja libera el lugar");

// El criterio de aceptación de congelar: la congelada no permite revelar el código.
Check(EstadoDeTarjeta.PuedeRevelarseElCodigo(EstadoDeTarjeta.Activa),
    "Revelar: se permite con la tarjeta activa");
Check(!EstadoDeTarjeta.PuedeRevelarseElCodigo(EstadoDeTarjeta.Congelada),
    "Revelar: NO se permite con la tarjeta congelada");
Check(!EstadoDeTarjeta.PuedeRevelarseElCodigo(EstadoDeTarjeta.DadaDeBaja),
    "Revelar: NO se permite con la tarjeta dada de baja");

Check(EstadoDeTarjeta.PuedeCongelarse(EstadoDeTarjeta.Activa), "Congelar: se puede desde ACTIVA");
Check(!EstadoDeTarjeta.PuedeCongelarse(EstadoDeTarjeta.Congelada), "Congelar: no se recongela");
Check(!EstadoDeTarjeta.PuedeCongelarse(EstadoDeTarjeta.DadaDeBaja), "Congelar: no se puede desde la baja");

Check(EstadoDeTarjeta.PuedeDescongelarse(EstadoDeTarjeta.Congelada), "Descongelar: se puede desde CONGELADA");
Check(!EstadoDeTarjeta.PuedeDescongelarse(EstadoDeTarjeta.Activa), "Descongelar: la activa ya está descongelada");

// El criterio de aceptación de la baja: es terminal, no se revierte por ningún camino.
Check(!EstadoDeTarjeta.PuedeDescongelarse(EstadoDeTarjeta.DadaDeBaja),
    "Baja es terminal: una tarjeta dada de baja NO se descongela");
Check(!EstadoDeTarjeta.PuedeCongelarse(EstadoDeTarjeta.DadaDeBaja),
    "Baja es terminal: una tarjeta dada de baja NO se congela");
Check(!EstadoDeTarjeta.PuedeDarseDeBaja(EstadoDeTarjeta.DadaDeBaja),
    "Baja es terminal: no se da de baja dos veces");

Check(EstadoDeTarjeta.PuedeDarseDeBaja(EstadoDeTarjeta.Activa), "Baja: se puede desde ACTIVA");
Check(EstadoDeTarjeta.PuedeDarseDeBaja(EstadoDeTarjeta.Congelada),
    "Baja: se puede desde CONGELADA en un solo paso");

// --- Pago con tarjeta: signo y filtros ---
// El pago tiene que entrar en la taxonomía que ya existe, no quedar como DESCONOCIDO.
Check(SignoDeMovimiento.DeTipo(SignoDeMovimiento.TipoPagoConTarjeta) == SignoDeMovimiento.Debito,
    "Pago con tarjeta: es un DEBITO, igual que una transferencia enviada");
Check(SignoDeMovimiento.DeTipo(SignoDeMovimiento.TipoPagoConTarjeta) != SignoDeMovimiento.Desconocido,
    "Pago con tarjeta: NO queda como tipo desconocido");
Check(SignoDeMovimiento.TiposDelFiltro("debito").Contains(SignoDeMovimiento.TipoPagoConTarjeta),
    "Pago con tarjeta: entra en el filtro de débitos");
Check(!SignoDeMovimiento.TiposDelFiltro("credito").Contains(SignoDeMovimiento.TipoPagoConTarjeta),
    "Pago con tarjeta: NO entra en el filtro de créditos");
// El texto tiene que coincidir con la fila del catálogo que inserta Create(v.004).sql.
Check(SignoDeMovimiento.TipoPagoConTarjeta == "PAGO_CON_TARJETA",
    "Pago con tarjeta: el texto coincide con el catálogo de la base");

// --- El otro lado del pago: quien cobra ---
Check(SignoDeMovimiento.DeTipo(SignoDeMovimiento.TipoPagoRecibido) == SignoDeMovimiento.Credito,
    "Pago recibido: es un CREDITO para quien cobra");
Check(SignoDeMovimiento.TiposDelFiltro("credito").Contains(SignoDeMovimiento.TipoPagoRecibido),
    "Pago recibido: entra en el filtro de créditos");
Check(SignoDeMovimiento.TipoPagoRecibido == "PAGO_RECIBIDO",
    "Pago recibido: el texto coincide con el catálogo de la base");
// Los dos lados tienen signos opuestos: si coincidieran, un pago sumaría o restaría dos veces.
Check(SignoDeMovimiento.DeTipo(SignoDeMovimiento.TipoPagoConTarjeta)
   != SignoDeMovimiento.DeTipo(SignoDeMovimiento.TipoPagoRecibido),
    "Pago: los dos lados tienen signos opuestos");

// --- Número de operación ---
var fechaDeOperacion = new DateTime(2026, 9, 24, 12, 30, 0, DateTimeKind.Utc);
Check(DatosDeTarjeta.NumeroDeOperacion(fechaDeOperacion, 42) == "20260924-000042",
    "Número de operación: formato fecha-id con ceros adelante");
// Dos movimientos distintos no pueden compartir número: el id del movimiento ya es único.
Check(DatosDeTarjeta.NumeroDeOperacion(fechaDeOperacion, 42)
   != DatosDeTarjeta.NumeroDeOperacion(fechaDeOperacion, 43),
    "Número de operación: dos pagos del mismo día no lo comparten");

// --- Tipos de evento de la bitácora ---
// Tienen que coincidir con el CHECK CK_TarjetaEventos_Tipo: un typo acá sería un error al
// insertar, que recién aparecería en ejecución.
Check(TipoDeEventoDeTarjeta.Generada == "GENERADA", "Evento: GENERADA coincide con el CHECK");
Check(TipoDeEventoDeTarjeta.Congelada == "CONGELADA", "Evento: CONGELADA coincide con el CHECK");
Check(TipoDeEventoDeTarjeta.Descongelada == "DESCONGELADA", "Evento: DESCONGELADA coincide con el CHECK");
Check(TipoDeEventoDeTarjeta.DadaDeBaja == "DADA_DE_BAJA", "Evento: DADA_DE_BAJA coincide con el CHECK");

// DESCONGELADA es un evento que NO tiene estado equivalente: la tarjeta vuelve a ACTIVA. Es la
// razón por la que las dos listas no se pueden unificar.
Check(!EstadoDeTarjeta.EsEstadoConocido(TipoDeEventoDeTarjeta.Descongelada),
    "Evento: DESCONGELADA no es un estado de tarjeta, y por eso las dos listas son distintas");

// --- Mensajes de notificación de tarjeta ---
// Nunca pueden llevar el número completo ni el código: quedan guardados para siempre.
var numeroCompletoDePrueba = "4000111122223333";
var mensajeCongelada = MensajesDeNotificacion.TarjetaCongelada(
    DatosDeTarjeta.UltimosCuatro(numeroCompletoDePrueba));
Check(!mensajeCongelada.Contains(numeroCompletoDePrueba),
    "Aviso de tarjeta: no incluye el número completo");
Check(mensajeCongelada.Contains("3333"),
    "Aviso de tarjeta: incluye los últimos 4 para que el usuario sepa de qué tarjeta habla");

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

    public Task<bool> UpdateProfileAsync(
        int id, string nombre, string apellido, string email, CancellationToken c = default)
    {
        var perfil = items.FirstOrDefault(u => u.id == id);
        if (perfil is null) return Task.FromResult(false);

        perfil.nombre = nombre;
        perfil.apellido = apellido;
        perfil.email = email;
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
