namespace DigitalArs.Api.Interfaces;

public record FiltroDeMovimientos(
    int CuentaId,
    DateTime? DesdeUtc,
    DateTime? HastaUtc,
    IReadOnlyList<string> TiposIncluidos,
    int Page,
    int PageSize,
    // Los tipos que coinciden con el texto del buscador. null significa que el usuario no
    // buscó nada y no hay que filtrar; la lista vacía significa que buscó algo que no
    // coincide con ningún tipo, y eso tiene que devolver cero resultados.
    //
    // Por esa diferencia no se reusa TiposIncluidos, que trata la lista vacía como "sin
    // filtro": ahí una búsqueda sin coincidencias devolvería el historial completo.
    IReadOnlyList<string>? TiposDeLaBusqueda = null
);
