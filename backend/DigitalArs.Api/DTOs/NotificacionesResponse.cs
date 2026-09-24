namespace DigitalArs.Api.DTOs;

// Lo que devuelve GET /api/notificaciones: la tanda más reciente y el número del globito.
//
// Los dos datos viajan juntos y no en dos endpoints porque el front los necesita a la vez, y
// pedirlos por separado deja una ventana en la que el globito y la lista no coinciden.
//
// NoLeidas cuenta TODAS las no leídas del usuario, no solo las que vienen en Items: el globito
// tiene que ser correcto aunque haya más notificaciones que las que trae la tanda.
public record NotificacionesResponse(
    int NoLeidas,
    IReadOnlyList<NotificacionResponse> Items
);
