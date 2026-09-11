using System.Security.Claims;
using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Interfaces;
using DigitalArs.Api.Services;
using DigitlaArs.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace DigitlaArs.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController(
    UserManager<IdentityUser> users,
    DigitalArsDbContext db,
    AccountService accounts,
    ITokenService tokens) : ControllerBase
{
    [AllowAnonymous, HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var result = await accounts.CreateAsync(dto, dto.Password);
        if (result.User is null)
        {
            var firstError = result.Errors.FirstOrDefault() ?? "No se pudo registrar el usuario.";
            return BadRequest(new { message = firstError, errors = result.Errors });
        }

        return StatusCode(201, new { message = "Usuario registrado exitosamente.", email = result.User.Email });
    }

    [AllowAnonymous, HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await users.FindByEmailAsync(dto.Email.Trim());
        if (user is null || await users.IsLockedOutAsync(user) || !await users.HasPasswordAsync(user))
            return InvalidCredentials();

        if (!await users.CheckPasswordAsync(user, dto.Password))
        {
            await users.AccessFailedAsync(user);
            return InvalidCredentials();
        }

        var profile = await db.Usuarios.SingleOrDefaultAsync(u => u.identity_user_id == user.Id);
        if (profile is null) return InvalidCredentials();
        if (!profile.is_active)
            return StatusCode(403, new { code = "USER_INACTIVE", message = "Tu usuario está desactivado. Contactá al administrador." });

        await users.ResetAccessFailedCountAsync(user);
        return Ok(await tokens.CrearToken(user, profile.id));
    }

    [AllowAnonymous, HttpPost("initial-password")]
    public async Task<IActionResult> InitialPassword(InitialPasswordDto dto)
    {
        var user = await users.FindByEmailAsync(dto.Email.Trim());
        if (user is null || await users.HasPasswordAsync(user) ||
            !await users.VerifyUserTokenAsync(user, TokenOptions.DefaultProvider, AccountService.InitialPasswordPurpose, dto.InvitationToken))
            return BadRequest(new { code = "INVALID_INVITATION", message = "Invitación inválida o vencida." });

        var profile = await db.Usuarios.SingleOrDefaultAsync(u => u.identity_user_id == user.Id);
        if (profile is null) return BadRequest(new { code = "INVALID_INVITATION", message = "Invitación inválida o vencida." });
        if (!profile.is_active)
            return StatusCode(403, new { code = "USER_INACTIVE", message = "Tu usuario está desactivado. Contactá al administrador." });

        var result = await accounts.SetInitialPasswordAsync(user, dto.InvitationToken, dto.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = "No se pudo establecer la contraseña.", errors = AccountService.Errors(result) });

        return Ok(await tokens.CrearToken(user, profile.id));
    }

    [Authorize, HttpGet("test-protegido")]
    public IActionResult TestProtegido() => Ok(new { message = "Acceso autorizado con éxito a la API." });

    [Authorize, HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var identityUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (identityUserId is null) return Unauthorized();

        var user = await users.FindByIdAsync(identityUserId);
        if (user is null) return Unauthorized();

        var profile = await db.Usuarios.AsNoTracking()
            .SingleOrDefaultAsync(u => u.identity_user_id == identityUserId && u.is_active);
        if (profile is null) return Unauthorized();

        var roles = await users.GetRolesAsync(user);
        var role = roles.Contains("Administrador") ? "Administrador" : "Usuario";
        return Ok(new { usuarioId = profile.id, profile.nombre, profile.apellido, profile.email, role });
    }

    private UnauthorizedObjectResult InvalidCredentials() =>
        Unauthorized(new { code = "INVALID_CREDENTIALS", message = "Credenciales incorrectas." });
}