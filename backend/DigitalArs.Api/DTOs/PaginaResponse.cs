namespace DigitalArs.Api.DTOs;

// Envoltorio de cualquier listado paginado de la API. Es genérico para que el
// front reciba siempre la misma forma, sin importar qué se esté listando.
//
// TotalItems y TotalPages son los que le permiten al front dibujar el paginador
// sin tener que adivinar cuántas páginas quedan.
public record PaginaResponse<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages
);
