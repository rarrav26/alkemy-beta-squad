using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using DigitalArs.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigitalArs.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TransferenciasController(ITransferenciaService transferencias)
    : ControllerBase
{
    [HttpPost("resolver-destino")]
    [ProducesResponseType<DestinoResponseDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolverDestino(
        [FromBody] TransferenciaDto dto,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var resultado = await transferencias.ResolverDestinoAsync(dto, cancellationToken);

        if (resultado.Exitoso)
            return Ok(resultado.Valor);

        var error = RespuestaDeError.Desde(resultado, "No se pudo resolver el destino.");

        return resultado.Motivo switch
        {
            MotivoDeRechazo.DestinoNoEncontrado => NotFound(error),
            _ => StatusCode(StatusCodes.Status500InternalServerError, error)
        };
    }
}