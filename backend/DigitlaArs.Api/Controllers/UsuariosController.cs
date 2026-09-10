using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Services;
using DigitlaArs.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace DigitalArs.Api.Controllers;

[ApiController, Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class UsuariosController(AccountService accounts, DigitalArsDbContext db,
    UserManager<IdentityUser> users) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(UserProfileDto dto)
    {
        var result = await accounts.CreateAsync(dto, password: null);
        if (result.User is null) return BadRequest(new { message = "No se pudo crear el usuario.", errors = result.Errors });
        return StatusCode(201, new
        {
            usuarioId = result.Profile!.id, email = result.User.Email,
            requiresPasswordSetup = true,
            invitationToken = await accounts.CreateInvitationAsync(result.User),
            expiresInSeconds = 86400
        });
    }

    [HttpPost("{id:int}/invitation")]
    public async Task<IActionResult> ReissueInvitation(int id)
    {
        var profile = await db.Usuarios.FindAsync(id);
        var user = profile?.identity_user_id is null ? null : await users.FindByIdAsync(profile.identity_user_id);
        if (user is null) return NotFound();
        if (!profile!.is_active || await users.HasPasswordAsync(user))
            return BadRequest(new { message = "El usuario debe estar activo y sin contraseña definida." });
        var updated = await users.UpdateSecurityStampAsync(user);
        if (!updated.Succeeded) return Conflict(new { message = "No se pudo renovar la invitación." });
        return Ok(new { email = user.Email, requiresPasswordSetup = true,
            invitationToken = await accounts.CreateInvitationAsync(user), expiresInSeconds = 86400 });
    }

    [HttpPatch("{id:int}/active")]
    public async Task<IActionResult> SetActive(int id, ActiveStatusDto dto)
    {
        var profile = await db.Usuarios.FindAsync(id);
        if (profile is null) return NotFound();
        // Rotate first so a failed profile update cannot leave old tokens valid after reactivation.
        if (profile.identity_user_id is not null)
        {
            var user = await users.FindByIdAsync(profile.identity_user_id);
            if (user is not null && !(await users.UpdateSecurityStampAsync(user)).Succeeded)
                return Conflict(new { message = "No se pudo actualizar el usuario." });
        }
        profile.is_active = dto.IsActive!.Value;
        await db.SaveChangesAsync();
        return NoContent();
    }
}