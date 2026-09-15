namespace DigitalArs.Api.Interfaces;

// Lo que devuelve el repositorio: la página pedida y cuántos movimientos hay en total con esos filtros.
public record PaginaDeMovimientos(
    IReadOnlyList<MovimientoLeido> Items,
    int TotalItems
);
