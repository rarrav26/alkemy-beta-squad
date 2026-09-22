using DigitalArs.Api.DTOs;
using DigitalArs.Api.Errors;
using DigitalArs.Api.Helpers.Domain;
using DigitalArs.Api.Helpers.Results;
using DigitalArs.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DigitalArs.Api.Controllers;

[ApiController, Route("api/[controller]")]
[Authorize]
public class UsuariosController(IAccountService accounts) : ControllerBase
{
    private const string MensajeNoPuedeRecibirInvitacion =
        "El usuario debe estar activo y sin contraseña definida.";

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var resultado = await accounts.ObtenerUsuariosPaginadosAsync(page, pageSize, cancellationToken);
        return Ok(resultado);
    }

    [HttpPost]
    [Authorize(Roles = RolPrincipal.Administrador)]
    [ProducesResponseType<UsuarioCreadoResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(PerfilUsuarioDto dto)
    {
        var resultado = await accounts.CrearConInvitacionAsync(dto);
        if (resultado.Exitoso) return StatusCode(201, resultado.Valor);

        return BadRequest(new ErrorResponse { Message = "No se pudo crear el usuario.", Errors = resultado.Errores });
    }

    [HttpPost("{id:int}/invitation")]
    [Authorize(Roles = RolPrincipal.Administrador)]
    [ProducesResponseType<InvitacionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReissueInvitation(int id, CancellationToken cancellationToken)
    {
        var resultado = await accounts.ReemitirInvitacionAsync(id, cancellationToken);
        if (resultado.Exitoso) return Ok(resultado.Valor);

        return ErrorDeGestion(resultado.Motivo!.Value, "No se pudo renovar la invitación.");
    }

    [HttpPatch("{id:int}/active")]
    [Authorize(Roles = RolPrincipal.Administrador)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SetActive(int id, EstadoActivoDto dto, CancellationToken cancellationToken)
    {
        var motivo = await accounts.CambiarEstadoAsync(id, dto.IsActive!.Value, cancellationToken);
        if (motivo is null) return NoContent();

        return ErrorDeGestion(motivo.Value, "No se pudo actualizar el usuario.");
    }

    private IActionResult ErrorDeGestion(MotivoDeRechazo motivo, string mensajeDeConflicto) => motivo switch
    {
        MotivoDeRechazo.NoEncontrado => NotFound(),
        MotivoDeRechazo.NoPuedeRecibirInvitacion =>
            BadRequest(new ErrorResponse { Message = MensajeNoPuedeRecibirInvitacion }),
        _ => Conflict(new ErrorResponse { Message = mensajeDeConflicto })
    };

    [HttpGet("{id:int}")]
    [Authorize(Roles = RolPrincipal.Administrador)]
    [ProducesResponseType<UsuarioResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var resultado = await accounts.ObtenerPorIdAsync(id, cancellationToken);
        if (resultado.Exitoso) return Ok(resultado.Valor);

        return resultado.Motivo == MotivoDeRechazo.NoEncontrado
            ? NotFound()
            : StatusCode(StatusCodes.Status500InternalServerError);
    }

    [HttpGet("me")]
    [ProducesResponseType<UsuarioResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var identityUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")?.Value
                             ?? User.FindFirst("id")?.Value
                             ?? User.FindFirst("nameid")?.Value;

        if (string.IsNullOrWhiteSpace(identityUserId)) return Unauthorized();

        if (int.TryParse(identityUserId, out var usuarioId))
        {
            var resPorId = await accounts.ObtenerPorIdAsync(usuarioId, cancellationToken);
            if (resPorId.Exitoso) return Ok(resPorId.Valor);
        }

        var resultado = await accounts.ObtenerPorIdentityUserIdAsync(identityUserId, cancellationToken);
        if (resultado.Exitoso) return Ok(resultado.Valor);

        return resultado.Motivo == MotivoDeRechazo.NoEncontrado
            ? NotFound()
            : StatusCode(StatusCodes.Status500InternalServerError);
    }

    [HttpPatch("me")]
    [ProducesResponseType<UsuarioResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponse { Message = "Datos inválidos.", Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToArray() });

        var identityUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")?.Value
                             ?? User.FindFirst("id")?.Value
                             ?? User.FindFirst("nameid")?.Value;

        if (string.IsNullOrWhiteSpace(identityUserId)) return Unauthorized();

        var resultado = await accounts.UpdateProfileAsync(identityUserId, dto, cancellationToken);
        if (resultado.Exitoso) return Ok(resultado.Valor);

        return resultado.Motivo switch
        {
            MotivoDeRechazo.NoEncontrado => NotFound(),
            MotivoDeRechazo.DatosInvalidos => BadRequest(new ErrorResponse { Message = "Error de validación.", Errors = resultado.Errores }),
            MotivoDeRechazo.NoSePudoActualizar => StatusCode(StatusCodes.Status500InternalServerError, new ErrorResponse { Message = "No se pudo actualizar el perfil." }),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }
}