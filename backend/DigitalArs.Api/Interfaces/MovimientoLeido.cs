namespace DigitalArs.Api.Interfaces;

// Una fila del historial tal como sale de la base.
//
// UltimosCuatro tiene valor SOLO en un pago con tarjeta: es null en depósitos y transferencias,
// que no salen de ninguna tarjeta. Sale de un join contra Tarjetas, no de una copia guardada en
// Movimientos, así que siempre dice la verdad sobre la tarjeta que se usó.
//
// Contraparte es null en todo lo que no es una transferencia (por ejemplo, un depósito).
public record MovimientoLeido(
    int Id,
    DateTime FechaUtc,
    string Tipo,
    decimal Importe,
    string? UltimosCuatro,
    ContraparteLeida? Contraparte
);
