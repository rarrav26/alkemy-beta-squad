namespace DigitalArs.Api.DTOs;

public record DepositoResponse(
    string Message,
    int MovimientoId,
    decimal Importe,
    decimal SaldoActual,
    DateTime Fecha
);