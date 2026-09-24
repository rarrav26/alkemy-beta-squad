namespace DigitalArs.Api.Interfaces;

// Contraparte es null en todo lo que no es una transferencia (por ejemplo, un depósito).
public record MovimientoLeido(
    int Id,
    DateTime FechaUtc,
    string Tipo,
    decimal Importe,
    ContraparteLeida? Contraparte
);
