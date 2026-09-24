namespace DigitalArs.Api.DTOs;

// El comprobante del pago. Devuelve el saldo actualizado para que el dashboard no tenga que
// volver a consultar la cuenta, mismo criterio que DepositoResponse.
/// <param name="Message">Texto listo para mostrar.</param>
/// <param name="NumeroDeOperacion">Identificador del pago, como el de un comprobante bancario.</param>
/// <param name="MovimientoId">El movimiento que registró el pago, para ir a su detalle.</param>
/// <param name="Importe">Lo que se pagó.</param>
/// <param name="SaldoActual">El saldo de la cuenta después del pago.</param>
/// <param name="UltimosCuatro">Los últimos 4 dígitos de la tarjeta usada.</param>
/// <param name="Titular">A nombre de quién quedó el pago.</param>
/// <param name="Destino">El alias o CVU que recibió el pago.</param>
/// <param name="Concepto">El concepto, si se envió.</param>
/// <param name="Fecha">Cuándo se hizo, con huso incluido.</param>
public record PagoConTarjetaResponse(
    string Message,
    string NumeroDeOperacion,
    int MovimientoId,
    decimal Importe,
    decimal SaldoActual,
    string UltimosCuatro,
    string Titular,
    string Destino,
    string? Concepto,
    DateTimeOffset Fecha
);
