namespace DigitalArs.Api.Interfaces;

public record FiltroDeMovimientos(
    int CuentaId,
    DateTime? DesdeUtc,
    DateTime? HastaUtc,
    IReadOnlyList<string> TiposIncluidos,
    int Page,
    int PageSize
);
