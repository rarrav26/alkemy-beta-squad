using System.Security.Claims;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Errors;
using DigitalArs.Api.Helpers.Domain;
using DigitalArs.Api.Helpers.Results;
using DigitalArs.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DigitalArs.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TarjetasController(ITarjetaService tarjetas) : ControllerBase
{
    /// <summary>Genera la tarjeta virtual de la cuenta. Falla si ya hay una vigente.</summary>
    [HttpPost]
    [ProducesResponseType<TarjetaResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Generar(CancellationToken cancellationToken)
    {
        var identityUserId = IdentityUserId();
        if (identityUserId is null) return Unauthorized();

        var resultado = await tarjetas.GenerarAsync(identityUserId, cancellationToken);

        // 201 y no 200: la operación creó un recurso nuevo.
        if (resultado.Exitoso)
            return CreatedAtAction(nameof(ObtenerMiTarjeta), resultado.Valor);

        return Mapear(resultado, "No se pudo generar la tarjeta.");
    }

    /// <summary>La tarjeta vigente, con el número enmascarado y sin el código de seguridad.</summary>
    [HttpGet("me")]
    [ProducesResponseType<TarjetaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerMiTarjeta(CancellationToken cancellationToken)
    {
        var identityUserId = IdentityUserId();
        if (identityUserId is null) return Unauthorized();

        var resultado = await tarjetas.ObtenerMiTarjetaAsync(identityUserId, cancellationToken);

        return resultado.Exitoso
            ? Ok(resultado.Valor)
            : Mapear(resultado, "No se pudo consultar la tarjeta.");
    }

    /// <summary>Devuelve el número completo y el código de seguridad. Exige la contraseña.</summary>
    // POST y no GET aunque sea una lectura: lleva la contraseña en el cuerpo, y un GET no
    // tiene cuerpo. Además evita que el número quede en el historial del navegador o en los
    // logs de acceso, que es donde terminan las query strings.
    //
    // Hereda la política "auth" del proyecto (20 pedidos por minuto por IP): el tope de 3
    // intentos del servicio es por usuario, y esto agrega un techo por origen.
    [HttpPost("me/revelar")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType<TarjetaSecretoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Revelar(
        [FromBody] RevelarTarjetaDto dto,
        CancellationToken cancellationToken)
    {
        var identityUserId = IdentityUserId();
        if (identityUserId is null) return Unauthorized();

        var resultado = await tarjetas.RevelarAsync(identityUserId, dto.Password, cancellationToken);

        return resultado.Exitoso
            ? Ok(resultado.Valor)
            : Mapear(resultado, "No se pudo mostrar el código de seguridad.");
    }

    /// <summary>Congela o descongela la tarjeta.</summary>
    [HttpPatch("me/congelada")]
    [ProducesResponseType<TarjetaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CambiarCongelamiento(
        [FromBody] CongelarTarjetaDto dto,
        CancellationToken cancellationToken)
    {
        var identityUserId = IdentityUserId();
        if (identityUserId is null) return Unauthorized();

        // El DTO valida que Congelada venga, así que acá ya no puede ser null.
        var resultado = await tarjetas.CambiarCongelamientoAsync(
            identityUserId, dto.Congelada!.Value, cancellationToken);

        return resultado.Exitoso
            ? Ok(resultado.Valor)
            : Mapear(resultado, "No se pudo cambiar el estado de la tarjeta.");
    }

    /// <summary>Da de baja la tarjeta de forma permanente. No se puede revertir.</summary>
    // Endpoint separado del toggle de congelamiento a propósito: es irreversible, y meterla
    // como un valor más del PATCH anterior invitaría a un error de cliente que no se puede
    // deshacer.
    [HttpPatch("me/baja")]
    [ProducesResponseType<TarjetaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DarDeBaja(CancellationToken cancellationToken)
    {
        var identityUserId = IdentityUserId();
        if (identityUserId is null) return Unauthorized();

        var resultado = await tarjetas.DarDeBajaAsync(identityUserId, cancellationToken);

        return resultado.Exitoso
            ? Ok(resultado.Valor)
            : Mapear(resultado, "No se pudo dar de baja la tarjeta.");
    }

    /// <summary>Paga con la tarjeta, descontando del saldo de la cuenta.</summary>
    // Registra un movimiento de tipo PAGO_CON_TARJETA, así el pago aparece en el historial y en
    // el saldo como cualquier otro débito. Exige la tarjeta ACTIVA: una congelada no paga.
    [HttpPost("me/pagar")]
    [ProducesResponseType<PagoConTarjetaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Pagar(
        [FromBody] PagoConTarjetaDto dto,
        CancellationToken cancellationToken)
    {
        var identityUserId = IdentityUserId();
        if (identityUserId is null) return Unauthorized();

        var resultado = await tarjetas.PagarAsync(identityUserId, dto, cancellationToken);

        return resultado.Exitoso
            ? Ok(resultado.Valor)
            : Mapear(resultado, "No se pudo realizar el pago.");
    }

    /// <summary>Resumen de actividad de tarjetas de un usuario. Solo para administradores.</summary>
    // Responde "cuántas veces congeló su tarjeta" y "cuántas dio de baja", que el estado actual
    // por sí solo no puede contestar.
    //
    // [Authorize(Roles = ...)] explícito además del [Authorize] de la clase: sin el rol, un
    // usuario común podría auditar a cualquier otro pasando su id. Es el mismo agujero que
    // cerramos en el listado de usuarios.
    [HttpGet("resumen/{usuarioId:int}")]
    [Authorize(Roles = RolPrincipal.Administrador)]
    [ProducesResponseType<ResumenDeTarjetasResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerResumen(
        int usuarioId,
        CancellationToken cancellationToken)
    {
        var resultado = await tarjetas.ObtenerResumenAsync(usuarioId, cancellationToken);

        if (resultado.Exitoso) return Ok(resultado.Valor);

        var error = RespuestaDeError.Desde(resultado, "No se pudo obtener el resumen.");

        // No usa Mapear: ahí NoEncontrado significa "no existe el usuario del token" y devuelve
        // 401. Acá significa "no existe el usuario consultado", que es un 404.
        return resultado.Motivo switch
        {
            MotivoDeRechazo.NoEncontrado => NotFound(error),
            _ => StatusCode(StatusCodes.Status500InternalServerError, error)
        };
    }

    // ---------------------------------------------------------------------------------------

    private string? IdentityUserId()
    {
        var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return string.IsNullOrWhiteSpace(id) ? null : id;
    }

    // Los cinco endpoints traducen los mismos motivos a los mismos status, así que el switch
    // está una sola vez. Si se repitiera en cada acción, dos de ellas terminarían devolviendo
    // códigos distintos para el mismo motivo.
    private IActionResult Mapear<T>(Resultado<T> resultado, string mensajePorDefecto)
        where T : class
    {
        var error = RespuestaDeError.Desde(resultado, mensajePorDefecto);

        return resultado.Motivo switch
        {
            // El token es válido pero el perfil no existe: la sesión no sirve.
            MotivoDeRechazo.NoEncontrado => Unauthorized(),

            // Autenticado pero sin permiso para operar.
            MotivoDeRechazo.UsuarioDesactivado =>
                StatusCode(StatusCodes.Status403Forbidden, error),

            // El admin no tiene billetera. 404 y no 403: no es una cuestión de permisos.
            MotivoDeRechazo.CuentaNoEncontrada => NotFound(error),
            MotivoDeRechazo.TarjetaNoEncontrada => NotFound(error),

            // Ya hay una tarjeta vigente: conflicto con el estado actual del recurso.
            MotivoDeRechazo.TarjetaYaExiste => Conflict(error),

            // La transición pedida no corresponde al estado actual. También es un conflicto de
            // estado y no un problema de los datos enviados, así que 409 y no 400.
            MotivoDeRechazo.EstadoDeTarjetaNoPermiteLaOperacion => Conflict(error),

            // Contraseña incorrecta en el revelado, o datos inválidos en el pago. 400 y no 401:
            // la sesión sigue siendo válida, lo que falló es el dato enviado. Un 401 haría que
            // el front cerrara la sesión del usuario por haberse equivocado tipeando.
            MotivoDeRechazo.CredencialesInvalidas => BadRequest(error),
            MotivoDeRechazo.DatosInvalidos => BadRequest(error),

            // No alcanza la plata. 409 y no 400: el pedido está bien formado, lo que no da es
            // el estado de la cuenta. Es el mismo criterio que usa el resto del proyecto.
            MotivoDeRechazo.SaldoInsuficiente => Conflict(error),

            // El catálogo de tipos de movimiento no tiene PAGO_CON_TARJETA: falta correr
            // Create(v.004).sql. Es un problema de instalación, no del pedido.
            MotivoDeRechazo.TipoMovimientoNoConfigurado =>
                StatusCode(StatusCodes.Status500InternalServerError, error),

            MotivoDeRechazo.DemasiadosIntentos =>
                StatusCode(StatusCodes.Status429TooManyRequests, error),

            // Se agotaron los sorteos de número. Es un fallo del servidor, no del pedido.
            MotivoDeRechazo.NoSePudoGenerarTarjeta =>
                StatusCode(StatusCodes.Status503ServiceUnavailable, error),

            _ => StatusCode(StatusCodes.Status500InternalServerError, error)
        };
    }
}
