using System.Security.Claims;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using DigitalArs.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DigitalArs.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController(
    UserManager<IdentityUser> users,
    IUsuarioRepository usuarios,
    AccountService accounts,
    ITokenService tokens) : ControllerBase
{
    private const string RolAdministrador = "Administrador";
    private const string RolUsuario = "Usuario";

    [AllowAnonymous, HttpPost("register")]
    [ProducesResponseType<RegistroResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegistroDto dto)
    {
        var resultado = await accounts.CreateAsync(dto, dto.Password);
        if (!resultado.Exitoso)
        {
            var primerError = resultado.Errores.FirstOrDefault() ?? "No se pudo registrar el usuario.";
            return BadRequest(new ErrorResponse { Message = primerError, Errors = resultado.Errores });
        }

        // El autorregistro siempre crea con el rol Usuario, y ese rol siempre lleva cuenta en pesos.
        var cuenta = resultado.Cuenta!;
        return StatusCode(201, new RegistroResponse(
            Message: "Usuario registrado exitosamente.",
            Email: resultado.UsuarioIdentity!.Email,
            Alias: cuenta.alias,
            Cvu: cuenta.cvu,
            Saldo: cuenta.saldo));
    }

    [AllowAnonymous, HttpPost("login")]
    [ProducesResponseType<SesionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Login(InicioSesionDto dto, CancellationToken cancellationToken)
    {
        var usuarioIdentity = await users.FindByEmailAsync(dto.Email.Trim());
        if (usuarioIdentity is null) return CredencialesInvalidas();
        if (await users.IsLockedOutAsync(usuarioIdentity)) return CredencialesInvalidas();

        // El usuario que creó el administrador todavía no eligió contraseña: se lo deriva a la
        // pantalla de primera contraseña en vez de darle el error genérico.
        if (!await users.HasPasswordAsync(usuarioIdentity)) return FaltaDefinirPassword();

        if (!await users.CheckPasswordAsync(usuarioIdentity, dto.Password))
        {
            await users.AccessFailedAsync(usuarioIdentity);
            return CredencialesInvalidas();
        }

        var perfil = await usuarios.GetByIdentityUserIdAsync(usuarioIdentity.Id, cancellationToken);
        if (perfil is null) return CredencialesInvalidas();
        if (!perfil.is_active) return UsuarioDesactivado();

        await users.ResetAccessFailedCountAsync(usuarioIdentity);
        return Ok(await tokens.CrearToken(usuarioIdentity, perfil.id));
    }

    [AllowAnonymous, HttpPost("initial-password")]
    [ProducesResponseType<SesionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> InitialPassword(PrimeraPasswordDto dto, CancellationToken cancellationToken)
    {
        var usuarioIdentity = await users.FindByEmailAsync(dto.Email.Trim());
        if (usuarioIdentity is null) return InvitacionInvalida();
        if (await users.HasPasswordAsync(usuarioIdentity)) return InvitacionInvalida();
        if (!await EsInvitacionValidaAsync(usuarioIdentity, dto.InvitationToken)) return InvitacionInvalida();

        var perfil = await usuarios.GetByIdentityUserIdAsync(usuarioIdentity.Id, cancellationToken);
        if (perfil is null) return InvitacionInvalida();
        if (!perfil.is_active) return UsuarioDesactivado();

        var resultado = await accounts.SetInitialPasswordAsync(usuarioIdentity, dto.InvitationToken, dto.Password);
        if (!resultado.Succeeded)
            return BadRequest(new ErrorResponse
            {
                Message = "No se pudo establecer la contraseña.",
                Errors = AccountService.Errors(resultado)
            });

        return Ok(await tokens.CrearToken(usuarioIdentity, perfil.id));
    }

    [Authorize, HttpGet("test-protegido")]
    [ProducesResponseType<MensajeResponse>(StatusCodes.Status200OK)]
    public IActionResult TestProtegido() => Ok(new MensajeResponse("Acceso autorizado con éxito a la API."));

    [Authorize, HttpGet("me")]
    [ProducesResponseType<PerfilResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var identityUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (identityUserId is null) return Unauthorized();

        var usuarioIdentity = await users.FindByIdAsync(identityUserId);
        if (usuarioIdentity is null) return Unauthorized();

        var perfil = await usuarios.GetByIdentityUserIdAsync(identityUserId, cancellationToken);
        if (perfil is null) return Unauthorized();
        if (!perfil.is_active) return Unauthorized();

        var roles = await users.GetRolesAsync(usuarioIdentity);
        return Ok(new PerfilResponse(perfil.id, perfil.nombre, perfil.apellido, perfil.email, RolPrincipal(roles)));
    }

    private Task<bool> EsInvitacionValidaAsync(IdentityUser usuarioIdentity, string invitationToken) =>
        users.VerifyUserTokenAsync(
            usuarioIdentity, TokenOptions.DefaultProvider, AccountService.InitialPasswordPurpose, invitationToken);

    // Un usuario puede tener más de un rol; al frontend se le informa el de mayor alcance.
    private static string RolPrincipal(IList<string> roles)
    {
        if (roles.Contains(RolAdministrador)) return RolAdministrador;
        return RolUsuario;
    }

    private UnauthorizedObjectResult CredencialesInvalidas() =>
        Unauthorized(new ErrorResponse { Code = "INVALID_CREDENTIALS", Message = "Credenciales incorrectas." });

    private ObjectResult UsuarioDesactivado() =>
        StatusCode(403, new ErrorResponse
        {
            Code = "USER_INACTIVE",
            Message = "Tu usuario está desactivado. Contactá al administrador."
        });

    private BadRequestObjectResult InvitacionInvalida() =>
        BadRequest(new ErrorResponse { Code = "INVALID_INVITATION", Message = "Invitación inválida o vencida." });

    private ObjectResult FaltaDefinirPassword() =>
        StatusCode(409, new ErrorResponse
        {
            Code = "PASSWORD_SETUP_REQUIRED",
            Message = "Todavía no definiste tu contraseña. Usá el código de invitación que te dio el administrador."
        });
}
