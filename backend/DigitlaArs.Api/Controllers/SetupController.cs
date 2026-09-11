using DigitalArs.Api.Data.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace DigitalArs.Api.Controllers;

// Compatibilidad con el frontend: le permite saber si ya existe un administrador.
// El alta del administrador inicial se hace por CLI (dotnet run --bootstrap-admin), no por HTTP.
[ApiController, Route("api/setup")]
public class SetupController(AuthDbContext auth) : ControllerBase
{
    [AllowAnonymous, HttpGet("status")]
    public async Task<IActionResult> Status()
    {
        Response.Headers.CacheControl = "no-store";
        var hasAdmin = await auth.UserRoles.AnyAsync(ur => auth.Roles.Any(r => r.Id == ur.RoleId && r.Name == "Administrador"));
        return Ok(new { requiresSetup = !hasAdmin, setupEnabled = false, requiresSetupKey = false });
    }

    [AllowAnonymous, HttpPost("admin")]
    public IActionResult CreateAdmin() => StatusCode(410, new
    { code = "ADMIN_MANAGED_BY_CLI", message = "El administrador inicial se crea desde el backend con: dotnet run --bootstrap-admin" });
}
