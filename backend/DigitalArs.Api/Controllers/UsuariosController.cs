using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using DigitalArs.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigitalArs.Api.Controllers;

[ApiController, Route("api/[controller]")]
[Authorize(Roles = RolPrincipal.Administrador)]
public class UsuariosController(IAccountService accounts) : ControllerBase
{
    private const string MensajeNoPuedeRecibirInvitacion =
        "El usuario debe estar activo y sin contraseña definida.";

    [HttpPost]
    [ProducesResponseType<UsuarioCreadoResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(PerfilUsuarioDto dto)
    {
        var resultado = await accounts.CrearConInvitacionAsync(dto);
        if (resultado.Exitoso) return StatusCode(201, resultado.Valor);

        return BadRequest(new ErrorResponse { Message = "No se pudo crear el usuario.", Errors = resultado.Errores });
    }

    [HttpPost("{id:int}/invitation")]
    [ProducesResponseType<InvitacionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReissueInvitation(int id, CancellationToken cancellationToken)
    {
        var resultado = await accounts.ReemitirInvitacionAsync(id, cancellationToken);
        if (resultado.Exitoso) return Ok(resultado.Valor);

        return ErrorDeGestion(resultado.Motivo!.Value, "No se pudo renovar la invitación.");
    }

    [HttpPatch("{id:int}/active")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SetActive(int id, EstadoActivoDto dto, CancellationToken cancellationToken)
    {
        var motivo = await accounts.CambiarEstadoAsync(id, dto.IsActive!.Value, cancellationToken);
        if (motivo is null) return NoContent();

        return ErrorDeGestion(motivo.Value, "No se pudo actualizar el usuario.");
    }

    // El texto del conflicto lo pone cada endpoint porque nombra la operación que falló.
    private IActionResult ErrorDeGestion(MotivoDeRechazo motivo, string mensajeDeConflicto) => motivo switch
    {
        MotivoDeRechazo.NoEncontrado => NotFound(),
        MotivoDeRechazo.NoPuedeRecibirInvitacion =>
            BadRequest(new ErrorResponse { Message = MensajeNoPuedeRecibirInvitacion }),
        _ => Conflict(new ErrorResponse { Message = mensajeDeConflicto })
    };
}
