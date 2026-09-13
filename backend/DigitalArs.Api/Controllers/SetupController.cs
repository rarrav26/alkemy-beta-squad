using DigitalArs.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
namespace DigitalArs.Api.Controllers;

// Compatibilidad con el frontend: le permite saber si ya existe un administrador.
// El administrador inicial lo crea database/Seed(v.003).sql, no la API.
[ApiController, Route("api/setup")]
public class SetupController(UserManager<IdentityUser> users) : ControllerBase
{
    [AllowAnonymous, HttpGet("status")]
    [ProducesResponseType<EstadoSetupResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Status()
    {
        Response.Headers.CacheControl = "no-store";
        var hayAdministrador = (await users.GetUsersInRoleAsync("Administrador")).Count > 0;
        return Ok(new EstadoSetupResponse(RequiresSetup: !hayAdministrador, SetupEnabled: false, RequiresSetupKey: false));
    }
}
