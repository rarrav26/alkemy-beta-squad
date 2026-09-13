using Microsoft.AspNetCore.Mvc;

namespace DigitalArs.Api.Controllers;

// Todavía sin endpoints: depósitos y transferencias son un pendiente declarado en MAP.md §19.
// Cuando se implemente, seguir el patrón de TiposDeMovimientosController.
[Route("api/[controller]")]
[ApiController]
public class MovimientosController : ControllerBase
{
}
