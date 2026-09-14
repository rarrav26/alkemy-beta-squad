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
public class CuentasController(ICuentaService cuentas)
    : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType<CuentaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ObtenerMiCuenta(
        CancellationToken cancellationToken)
    {
        var identityUserId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(identityUserId))
            return Unauthorized();

        var resultado = await cuentas.ObtenerMiCuentaAsync(
            identityUserId,
            cancellationToken);

        if (resultado.Exitoso)
            return Ok(resultado.Valor);

        var error = new ErrorResponse
        {
            Code = resultado.Motivo?.ToString(),
            Message = resultado.Errores.FirstOrDefault()
                ?? "No se pudo consultar la cuenta.",
            Errors = resultado.Errores
        };

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
}