namespace DigitalArs.Api.Interfaces;

public record MovimientoLeido(
    int Id,
    DateTime FechaUtc,
    string Tipo,
    decimal Importe
);
