using System.Security.Claims;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using DigitalArs.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigitalArs.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MovimientosController(
    IDepositoService depositos,
    IHistorialService historial)
    : ControllerBase
{

    [HttpGet]
    [ProducesResponseType<PaginaResponse<MovimientoResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ObtenerHistorial(
        [FromQuery] HistorialMovimientosDto filtros,
        CancellationToken cancellationToken)
    {
        var identityUserId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(identityUserId))
            return Unauthorized();

        var resultado = await historial.ConsultarAsync(
            identityUserId,
            filtros,
            cancellationToken);

        if (resultado.Exitoso)
            return Ok(resultado.Valor);

        var error = RespuestaDeError.Desde(
            resultado,
            "No se pudo consultar el historial de movimientos.");

        return resultado.Motivo switch
        {
            MotivoDeRechazo.NoEncontrado =>
                Unauthorized(),

            MotivoDeRechazo.UsuarioDesactivado =>
                StatusCode(StatusCodes.Status403Forbidden, error),

            MotivoDeRechazo.CuentaNoEncontrada =>
                NotFound(error),

            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                error)
        };
    }

    [HttpPost("depositos")]
    [ProducesResponseType<DepositoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Depositar(
        [FromBody] DepositoDto dto,
        CancellationToken cancellationToken)
    {
        var identityUserId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(identityUserId))
            return Unauthorized();

        var resultado = await depositos.DepositarAsync(
            identityUserId,
            dto,
            cancellationToken);

        if (resultado.Exitoso)
            return Ok(resultado.Valor);

        var error = RespuestaDeError.Desde(
            resultado,
            "No se pudo realizar el depósito.");

        return resultado.Motivo switch
        {
            MotivoDeRechazo.DatosInvalidos =>
                BadRequest(error),

            MotivoDeRechazo.UsuarioDesactivado =>
                StatusCode(StatusCodes.Status403Forbidden, error),

            MotivoDeRechazo.NoEncontrado =>
                Unauthorized(),

            MotivoDeRechazo.CuentaNoEncontrada =>
                NotFound(error),

            MotivoDeRechazo.SaldoMaximoSuperado =>
                Conflict(error),

            MotivoDeRechazo.NoSePudoActualizar =>
                Conflict(error),

            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                error)
        };
    }
}