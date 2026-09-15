namespace DigitalArs.Api.DTOs;

// Fecha viaja en hora de Argentina con el huso incluido ("2026-09-14T10:05:22-03:00"),
// igual que en el historial: los dos endpoints hablan de fechas de la misma forma.
public record DepositoResponse(
    string Message,
    int MovimientoId,
    decimal Importe,
    decimal SaldoActual,
    DateTimeOffset Fecha
);