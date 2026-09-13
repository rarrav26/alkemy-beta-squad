using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DigitalArs.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TiposDeMovimientosController(ITipoMovimientoRepository tiposDeMovimientos) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<TipoMovimientoResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var tipos = await tiposDeMovimientos.GetAllAsync(cancellationToken);
        var response = tipos.Select(ToResponse).ToList();
        return Ok(response);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<TipoMovimientoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var tipo = await tiposDeMovimientos.GetByIdAsync(id, cancellationToken);
        if (tipo is null) return NotFound();
        return Ok(ToResponse(tipo));
    }

    private static TipoMovimientoResponse ToResponse(Tipo_Movimiento tipo) =>
        new(tipo.id, tipo.descripcion);
}
