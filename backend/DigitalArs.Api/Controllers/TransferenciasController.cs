using DigitalArs.Api.DTOs;
using DigitalArs.Api.Errors;
using DigitalArs.Api.Helpers.Results;
using DigitalArs.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DigitalArs.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransferenciasController(ITransferenciaService transferencias) : ControllerBase
{
    // PASO 1: Valida y resuelve el alias/CVU (devuelve DestinoResponseDto)
    [HttpPost("resolver-destino")]
    [ProducesResponseType<DestinoResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ResolverDestino(
        [FromBody] TransferenciaDto dto,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var identityUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrWhiteSpace(identityUserId))
            return Unauthorized();

        var resultado = await transferencias.ResolverDestinoAsync(identityUserId, dto, cancellationToken);

        if (resultado.Exitoso)
            return Ok(resultado.Valor);

        var error = RespuestaDeError.Desde(resultado, "No se pudo resolver el destino.");

        return resultado.Motivo switch
        {
            MotivoDeRechazo.DestinoNoEncontrado => NotFound(error),
            MotivoDeRechazo.UsuarioDesactivado => BadRequest(error),
            MotivoDeRechazo.MismaCuenta => BadRequest(error),
            MotivoDeRechazo.DatosInvalidos => BadRequest(error),
            MotivoDeRechazo.CuentaNoEncontrada => NotFound(error),
            MotivoDeRechazo.SaldoInsuficiente => Conflict(error),
            MotivoDeRechazo.NoEncontrado => Unauthorized(),
            _ => StatusCode(StatusCodes.Status500InternalServerError, error)
        };
    }

    // PASO 2: Realiza la transferencia atómica (POST a /api/Transferencias)
    [HttpPost]
    [ProducesResponseType<TransferenciaResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Transferir(
        [FromBody] TransferenciaDto dto,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var identityUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrWhiteSpace(identityUserId))
            return Unauthorized();

        var resultado = await transferencias.TransferirAsync(identityUserId, dto, cancellationToken);

        if (resultado.Exitoso)
            return Ok(resultado.Valor);

        var error = RespuestaDeError.Desde(resultado, "No se pudo realizar la transferencia.");

        return resultado.Motivo switch
        {
            MotivoDeRechazo.DestinoNoEncontrado => NotFound(error),
            MotivoDeRechazo.UsuarioDesactivado => BadRequest(error),
            MotivoDeRechazo.MismaCuenta => BadRequest(error),
            MotivoDeRechazo.DatosInvalidos => BadRequest(error),
            MotivoDeRechazo.CuentaNoEncontrada => NotFound(error),
            MotivoDeRechazo.SaldoInsuficiente => Conflict(error),
            MotivoDeRechazo.SaldoMaximoSuperado => Conflict(error), // Mapeado explícito
            MotivoDeRechazo.NoSePudoActualizar => StatusCode(StatusCodes.Status500InternalServerError, error), // Mapeado explícito
            MotivoDeRechazo.TipoMovimientoNoConfigurado => StatusCode(StatusCodes.Status500InternalServerError, error), // Mapeado explícito
            MotivoDeRechazo.NoEncontrado => Unauthorized(),
            _ => StatusCode(StatusCodes.Status500InternalServerError, error)
        };
    }
}