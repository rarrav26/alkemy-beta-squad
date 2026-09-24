namespace DigitalArs.Api.DTOs;

// Una fila del historial.
//
// Fecha es DateTimeOffset y no DateTime para que viaje con el huso incluido
// ("2026-09-14T10:05:22-03:00"): el front la muestra tal cual, sin convertir.
//
// Tipo es la etiqueta para mostrar (DEPOSITO, TRANSFERENCIA_ENVIADA,
// TRANSFERENCIA_RECIBIDA) y Signo dice si el movimiento suma o resta
// (CREDITO / DEBITO), que es lo que el front necesita para el color y el signo.
//
// Contraparte es el nombre del titular de la otra cuenta en una transferencia: a quién se
// le envió (TRANSFERENCIA_ENVIADA) o quién la mandó (TRANSFERENCIA_RECIBIDA). Es null en lo
// que no es transferencia.
public record MovimientoResponse(
    int Id,
    DateTimeOffset Fecha,
    string Tipo,
    string Signo,
    decimal Importe,
    string? Contraparte
);
