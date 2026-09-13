using DigitalArs.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
namespace DigitalArs.Api.Controllers;

// Compatibilidad con el frontend: le permite saber si ya existe un administrador.
// El alta del administrador inicial se hace por CLI (dotnet run --bootstrap-admin), no por HTTP.
[ApiController, Route("api/setup")]
public class SetupController(UserManager<IdentityUser> users) : ControllerBase
{
    [AllowAnonymous, HttpGet("status")]
    [ProducesResponseType<SetupStatusResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Status()
    {
        Response.Headers.CacheControl = "no-store";
        var hasAdmin = (await users.GetUsersInRoleAsync("Administrador")).Count > 0;
        return Ok(new SetupStatusResponse(RequiresSetup: !hasAdmin, SetupEnabled: false, RequiresSetupKey: false));
    }

    [AllowAnonymous, HttpPost("admin")]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status410Gone)]
    public IActionResult CreateAdmin() => StatusCode(410, new ErrorResponse
    {
        Code = "ADMIN_MANAGED_BY_CLI",
        Message = "El administrador inicial se crea desde el backend con: dotnet run --bootstrap-admin"
    });
}
