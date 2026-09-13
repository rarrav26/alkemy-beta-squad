using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigitalArs.Api.Controllers;

// El catálogo ya lo exigía la política global de autorización; el atributo lo deja a la vista
// de quien lee el archivo.
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TiposDeMovimientosController(ITipoMovimientoRepository tiposDeMovimientos) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<TipoMovimientoResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var tipos = await tiposDeMovimientos.GetAllAsync(cancellationToken);
        return Ok(tipos);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<TipoMovimientoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var tipo = await tiposDeMovimientos.GetByIdAsync(id, cancellationToken);
        if (tipo is null) return NotFound();

        return Ok(tipo);
    }
}
