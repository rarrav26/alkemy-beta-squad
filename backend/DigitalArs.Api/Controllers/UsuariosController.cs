using DigitalArs.Api.Data.Entities;
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

    private const string MensajeNoPuedeRecibirInvitacion =
        "El usuario debe estar activo y sin contraseña definida.";

    [HttpPost]
    [ProducesResponseType<UsuarioCreadoResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(PerfilUsuarioDto dto)
    {
        var resultado = await accounts.CreateAsync(dto, password: null);
        if (!resultado.Exitoso)
            return BadRequest(new ErrorResponse { Message = "No se pudo crear el usuario.", Errors = resultado.Errores });

        var usuarioIdentity = resultado.UsuarioIdentity!;
        return StatusCode(201, new UsuarioCreadoResponse(
            UsuarioId: resultado.Perfil!.id,
            Email: usuarioIdentity.Email,
            RequiresPasswordSetup: true,
            InvitationToken: await accounts.CreateInvitationAsync(usuarioIdentity),
            ExpiresInSeconds: InvitacionExpiraEnSegundos));
    }

    [HttpPost("{id:int}/invitation")]
    [ProducesResponseType<InvitacionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReissueInvitation(int id, CancellationToken cancellationToken)
    {
        var perfil = await usuarios.GetByIdAsync(id, cancellationToken);
        if (perfil?.identity_user_id is null) return NotFound();

        var usuarioIdentity = await users.FindByIdAsync(perfil.identity_user_id);
        if (usuarioIdentity is null) return NotFound();

        var puedeRecibirInvitacion = perfil.is_active && !await users.HasPasswordAsync(usuarioIdentity);
        if (!puedeRecibirInvitacion)
            return BadRequest(new ErrorResponse { Message = MensajeNoPuedeRecibirInvitacion });

        // Renovar el stamp invalida la invitación anterior, así queda una sola vigente.
        var rotado = await users.UpdateSecurityStampAsync(usuarioIdentity);
        if (!rotado.Succeeded)
            return Conflict(new ErrorResponse { Message = "No se pudo renovar la invitación." });

        return Ok(new InvitacionResponse(
            Email: usuarioIdentity.Email,
            RequiresPasswordSetup: true,
            InvitationToken: await accounts.CreateInvitationAsync(usuarioIdentity),
            ExpiresInSeconds: InvitacionExpiraEnSegundos));
    }

    [HttpPatch("{id:int}/active")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SetActive(int id, EstadoActivoDto dto, CancellationToken cancellationToken)
    {
        var perfil = await usuarios.GetByIdAsync(id, cancellationToken);
        if (perfil is null) return NotFound();

        if (!await RevocarSesionesAsync(perfil))
            return Conflict(new ErrorResponse { Message = "No se pudo actualizar el usuario." });

        perfil.is_active = dto.IsActive!.Value;
        await usuarios.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    // Se revoca primero y se guarda después: si el guardado del perfil falla, los tokens viejos
    // ya dejaron de valer y no vuelven a servir cuando se reactive al usuario.
    private async Task<bool> RevocarSesionesAsync(Usuario perfil)
    {
        if (perfil.identity_user_id is null) return true;

        var usuarioIdentity = await users.FindByIdAsync(perfil.identity_user_id);
        if (usuarioIdentity is null) return true;

        var rotado = await users.UpdateSecurityStampAsync(usuarioIdentity);
        return rotado.Succeeded;
    }
}
