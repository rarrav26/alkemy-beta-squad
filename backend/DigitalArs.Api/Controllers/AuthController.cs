using System.Security.Claims;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using DigitalArs.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DigitalArs.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController(IAuthService auth, IAccountService accounts) : ControllerBase
{
    [AllowAnonymous, HttpPost("register")]
    [ProducesResponseType<RegistroResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegistroDto dto)
    {
        var resultado = await accounts.RegistrarAsync(dto);
        if (resultado.Exitoso) return StatusCode(201, resultado.Valor);

        var primerError = resultado.Errores.FirstOrDefault() ?? "No se pudo registrar el usuario.";
        return BadRequest(new ErrorResponse { Message = primerError, Errors = resultado.Errores });
    }

    [AllowAnonymous, HttpPost("login")]
    [ProducesResponseType<SesionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Login(InicioSesionDto dto, CancellationToken cancellationToken)
    {
        var resultado = await auth.LoginAsync(dto, cancellationToken);
        if (resultado.Exitoso) return Ok(resultado.Valor);

        return ErrorDeAcceso(resultado.Motivo!.Value);
    }

    [AllowAnonymous, HttpPost("initial-password")]
    [ProducesResponseType<SesionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> InitialPassword(PrimeraPasswordDto dto, CancellationToken cancellationToken)
    {
        var resultado = await auth.DefinirPrimeraPasswordAsync(dto, cancellationToken);
        if (resultado.Exitoso) return Ok(resultado.Valor);

        // Identity rechazó la contraseña elegida: sus mensajes explican qué le falta, así que
        // se devuelven a diferencia del resto de los errores de este endpoint.
        if (resultado.Motivo == MotivoDeRechazo.DatosInvalidos)
            return BadRequest(new ErrorResponse
            {
                Message = "No se pudo establecer la contraseña.",
                Errors = resultado.Errores
            });

        return ErrorDeAcceso(resultado.Motivo!.Value);
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

        var perfil = await auth.ObtenerPerfilAsync(identityUserId, cancellationToken);
        if (perfil is null) return Unauthorized();

        return Ok(perfil);
    }

    // El motivo genérico es el credenciales incorrectas: es el que no revela nada sobre la
    // cuenta, así que cualquier rechazo que no tenga una respuesta propia termina acá.
    private IActionResult ErrorDeAcceso(MotivoDeRechazo motivo) => motivo switch
    {
        MotivoDeRechazo.FaltaDefinirPassword => FaltaDefinirPassword(),
        MotivoDeRechazo.UsuarioDesactivado => UsuarioDesactivado(),
        MotivoDeRechazo.InvitacionInvalida => InvitacionInvalida(),
        _ => CredencialesInvalidas()
    };

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

    private ConflictObjectResult FaltaDefinirPassword() =>
        Conflict(new ErrorResponse
        {
            Code = "PASSWORD_SETUP_REQUIRED",
            Message = "Todavía no definiste tu contraseña. Usá el código de invitación que te dio el administrador."
        });
}
