using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using DigitalArs.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
namespace DigitalArs.Api.Controllers;

[ApiController, Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class UsuariosController(AccountService accounts, IUsuarioRepository usuarios,
    UserManager<IdentityUser> users) : ControllerBase
{
    private const int InvitacionExpiraEnSegundos = 86400;

    [HttpPost]
    [ProducesResponseType<UsuarioCreadoResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(UserProfileDto dto)
    {
        var result = await accounts.CreateAsync(dto, password: null);
        if (result.User is null)
            return BadRequest(new ErrorResponse { Message = "No se pudo crear el usuario.", Errors = result.Errors });

        return StatusCode(201, new UsuarioCreadoResponse(
            UsuarioId: result.Profile!.id,
            Email: result.User.Email,
            RequiresPasswordSetup: true,
            InvitationToken: await accounts.CreateInvitationAsync(result.User),
            ExpiresInSeconds: InvitacionExpiraEnSegundos));
    }

    [HttpPost("{id:int}/invitation")]
    [ProducesResponseType<InvitacionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReissueInvitation(int id)
    {
        var profile = await usuarios.GetByIdAsync(id);
        if (profile?.identity_user_id is null) return NotFound();

        var user = await users.FindByIdAsync(profile.identity_user_id);
        if (user is null) return NotFound();

        if (!profile.is_active || await users.HasPasswordAsync(user))
            return BadRequest(new ErrorResponse { Message = "El usuario debe estar activo y sin contraseña definida." });
        var updated = await users.UpdateSecurityStampAsync(user);
        if (!updated.Succeeded) return Conflict(new ErrorResponse { Message = "No se pudo renovar la invitación." });
        return Ok(new InvitacionResponse(
            Email: user.Email,
            RequiresPasswordSetup: true,
            InvitationToken: await accounts.CreateInvitationAsync(user),
            ExpiresInSeconds: InvitacionExpiraEnSegundos));
    }

    [HttpPatch("{id:int}/active")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SetActive(int id, ActiveStatusDto dto)
    {
        var profile = await usuarios.GetByIdAsync(id);
        if (profile is null) return NotFound();
        // Rotate first so a failed profile update cannot leave old tokens valid after reactivation.
        if (profile.identity_user_id is not null)
        {
            var user = await users.FindByIdAsync(profile.identity_user_id);
            if (user is not null && !(await users.UpdateSecurityStampAsync(user)).Succeeded)
                return Conflict(new ErrorResponse { Message = "No se pudo actualizar el usuario." });
        }
        profile.is_active = dto.IsActive!.Value;
        await usuarios.SaveChangesAsync();
        return NoContent();
    }
}
