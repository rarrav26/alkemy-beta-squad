using System.Security.Claims;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Errors;
using DigitalArs.Api.Helpers.Domain;
using DigitalArs.Api.Helpers.Results;
using DigitalArs.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigitalArs.Api.Controllers;

// Solo el rol Usuario: el administrador no tiene billetera, así que tampoco tiene campana.
[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = RolPrincipal.Usuario)]
public class NotificacionesController(INotificacionService notificaciones)
    : ControllerBase
{
    /// <summary>Las notificaciones más recientes del usuario y cuántas tiene sin leer.</summary>
    [HttpGet]
    [ProducesResponseType<NotificacionesResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Listar(CancellationToken cancellationToken)
    {
        var identityUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(identityUserId))
            return Unauthorized();

        var resultado = await notificaciones.ListarAsync(
            identityUserId,
            cancellationToken);

        if (resultado.Exitoso)
            return Ok(resultado.Valor);

        var error = RespuestaDeError.Desde(
            resultado,
            "No se pudieron consultar las notificaciones.");

        return resultado.Motivo switch
        {
            MotivoDeRechazo.NoEncontrado =>
                Unauthorized(),

            MotivoDeRechazo.UsuarioDesactivado =>
                StatusCode(StatusCodes.Status403Forbidden, error),

            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                error)
        };
    }

    /// <summary>Marca una notificación como leída. Repetirlo no cambia nada ni falla.</summary>
    [HttpPatch("{id:int}/leida")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> MarcarLeida(
        int id,
        CancellationToken cancellationToken)
    {
        var identityUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(identityUserId))
            return Unauthorized();

        var motivo = await notificaciones.MarcarLeidaAsync(
            identityUserId,
            id,
            cancellationToken);

        if (motivo is null)
            return NoContent();

        return ErrorDeGestion(motivo.Value);
    }

    /// <summary>Marca como leídas todas las notificaciones del usuario.</summary>
    [HttpPatch("leidas")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> MarcarTodasLeidas(CancellationToken cancellationToken)
    {
        var identityUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(identityUserId))
            return Unauthorized();

        var motivo = await notificaciones.MarcarTodasLeidasAsync(
            identityUserId,
            cancellationToken);

        if (motivo is null)
            return NoContent();

        return ErrorDeGestion(motivo.Value);
    }

    // Las dos operaciones de marcado rechazan por los mismos motivos, así que la traducción a
    // status vive una sola vez.
    //
    // NotificacionNoEncontrada sale como 404 SIN cuerpo, igual que en UsuariosController: una
    // notificación de otro usuario y una que no existe tienen que ser indistinguibles, para no
    // confirmarle a nadie que ese id existe.
    private IActionResult ErrorDeGestion(MotivoDeRechazo motivo) => motivo switch
    {
        MotivoDeRechazo.NoEncontrado =>
            Unauthorized(),

        MotivoDeRechazo.NotificacionNoEncontrada =>
            NotFound(),

        MotivoDeRechazo.UsuarioDesactivado =>
            StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse
            {
                Code = motivo.ToString(),
                Message = "Tu usuario está desactivado."
            }),

        _ => StatusCode(StatusCodes.Status500InternalServerError, new ErrorResponse
        {
            Code = motivo.ToString(),
            Message = "No se pudo actualizar la notificación."
        })
    };
}
