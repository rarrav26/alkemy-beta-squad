using System.Security.Claims;
using System.Linq;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using DigitalArs.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigitalArs.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CuentasController(ICuentaService cuentas, IAccountService accounts)
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

        var error = RespuestaDeError.Desde(
            resultado,
            "No se pudo consultar la cuenta.");

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

    [HttpPatch("me/alias")]
    [ProducesResponseType<CuentaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateAlias([FromBody] UpdateAliasDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponse { Message = "Alias inválido.", Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToArray() });

        var identityUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(identityUserId)) return Unauthorized();

        var resultado = await accounts.UpdateAliasAsync(identityUserId, dto.Alias, cancellationToken);
        if (resultado.Exitoso) return Ok(resultado.Valor);

        return resultado.Motivo switch
        {
            MotivoDeRechazo.DatosInvalidos => Conflict(new ErrorResponse { Message = resultado.Errores?.FirstOrDefault() ?? "Alias inválido o duplicado." }),
            MotivoDeRechazo.CuentaNoEncontrada => NotFound(new ErrorResponse { Message = "Cuenta no encontrada." }),
            _ => StatusCode(StatusCodes.Status500InternalServerError, new ErrorResponse { Message = "No se pudo actualizar el alias." })
        };
    }


}