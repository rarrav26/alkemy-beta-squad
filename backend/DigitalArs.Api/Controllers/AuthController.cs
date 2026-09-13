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
    [AllowAnonymous, HttpPost("register")]
    [ProducesResponseType<RegistroResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var result = await accounts.CreateAsync(dto, dto.Password);
        if (result.User is null)
        {
            var firstError = result.Errors.FirstOrDefault() ?? "No se pudo registrar el usuario.";
            return BadRequest(new ErrorResponse { Message = firstError, Errors = result.Errors });
        }

        return StatusCode(201, new RegistroResponse(
            Message: "Usuario registrado exitosamente.",
            Email: result.User.Email,
            Alias: result.Cuenta!.alias,
            Cvu: result.Cuenta.cvu,
            Saldo: result.Cuenta.saldo));
    }

    [AllowAnonymous, HttpPost("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await users.FindByEmailAsync(dto.Email.Trim());
        if (user is null || await users.IsLockedOutAsync(user))
            return InvalidCredentials();

        // El usuario que creó el administrador todavía no eligió contraseña: se lo
        // deriva a la pantalla de primera contraseña en vez del error genérico.
        if (!await users.HasPasswordAsync(user))
            return PasswordSetupRequired();

        if (!await users.CheckPasswordAsync(user, dto.Password))
        {
            await users.AccessFailedAsync(user);
            return InvalidCredentials();
        }

        var profile = await usuarios.GetByIdentityUserIdAsync(user.Id);
        if (profile is null) return InvalidCredentials();
        if (!profile.is_active) return UserInactive();

        await users.ResetAccessFailedCountAsync(user);
        return Ok(await tokens.CrearToken(user, profile.id));
    }

    [AllowAnonymous, HttpPost("initial-password")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> InitialPassword(InitialPasswordDto dto)
    {
        var user = await users.FindByEmailAsync(dto.Email.Trim());
        if (user is null || await users.HasPasswordAsync(user) ||
            !await users.VerifyUserTokenAsync(user, TokenOptions.DefaultProvider, AccountService.InitialPasswordPurpose, dto.InvitationToken))
            return InvalidInvitation();

        var profile = await usuarios.GetByIdentityUserIdAsync(user.Id);
        if (profile is null) return InvalidInvitation();
        if (!profile.is_active) return UserInactive();

        var result = await accounts.SetInitialPasswordAsync(user, dto.InvitationToken, dto.Password);
        if (!result.Succeeded)
            return BadRequest(new ErrorResponse
            {
                Message = "No se pudo establecer la contraseña.",
                Errors = AccountService.Errors(result)
            });

        return Ok(await tokens.CrearToken(user, profile.id));
    }

    [Authorize, HttpGet("test-protegido")]
    [ProducesResponseType<MensajeResponse>(StatusCodes.Status200OK)]
    public IActionResult TestProtegido() => Ok(new MensajeResponse("Acceso autorizado con éxito a la API."));

    [Authorize, HttpGet("me")]
    [ProducesResponseType<PerfilResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me()
    {
        var identityUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (identityUserId is null) return Unauthorized();

        var user = await users.FindByIdAsync(identityUserId);
        if (user is null) return Unauthorized();

        var profile = await usuarios.GetByIdentityUserIdAsync(identityUserId);
        if (profile is null || !profile.is_active) return Unauthorized();

        var roles = await users.GetRolesAsync(user);
        var role = roles.Contains("Administrador") ? "Administrador" : "Usuario";
        return Ok(new PerfilResponse(profile.id, profile.nombre, profile.apellido, profile.email, role));
    }

    private UnauthorizedObjectResult InvalidCredentials() =>
        Unauthorized(new ErrorResponse { Code = "INVALID_CREDENTIALS", Message = "Credenciales incorrectas." });

    private ObjectResult UserInactive() =>
        StatusCode(403, new ErrorResponse
        {
            Code = "USER_INACTIVE",
            Message = "Tu usuario está desactivado. Contactá al administrador."
        });

    private BadRequestObjectResult InvalidInvitation() =>
        BadRequest(new ErrorResponse { Code = "INVALID_INVITATION", Message = "Invitación inválida o vencida." });

    private ObjectResult PasswordSetupRequired() =>
        StatusCode(409, new ErrorResponse
        {
            Code = "PASSWORD_SETUP_REQUIRED",
            Message = "Todavía no definiste tu contraseña. Usá el código de invitación que te dio el administrador."
        });
}
