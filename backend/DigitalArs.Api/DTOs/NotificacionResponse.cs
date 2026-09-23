using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.Helpers.Common;

namespace DigitalArs.Api.DTOs;

// Una notificación como la lee el frontend.
//
// Fecha es DateTimeOffset y viaja con el huso incluido ("2026-09-23T17:44:25-03:00"), igual que
// en el historial y en el depósito: el front la muestra tal cual, sin convertir.
//
// MovimientoId no lo necesita la campana, pero es lo que va a permitir después llevar al
// usuario del aviso al detalle del movimiento que lo originó.
//
// POR QUE ESTE DTO TIENE UNA FACTORY Y LOS OTROS NO
// El resto de los DTOs son records pelados y el mapeo vive en el servicio que los arma. Acá el
// mismo contrato lo emiten DOS caminos distintos: la respuesta REST y, cuando se agregue
// SignalR, el aviso que se empuja por WebSocket. Con el mapeo en cada uno, un campo nuevo habría
// que acordarse de agregarlo en los dos, y el front recibiría formas distintas según por dónde
// llegó el aviso. Por eso la traducción vive una sola vez, acá.
public record NotificacionResponse(
    int Id,
    string Titulo,
    string Mensaje,
    bool Leida,
    int MovimientoId,
    DateTimeOffset Fecha
)
{
    public static NotificacionResponse Desde(Notificacion notificacion) =>
        new(
            Id: notificacion.id,
            Titulo: notificacion.titulo,
            Mensaje: notificacion.mensaje,
            Leida: notificacion.leida,
            MovimientoId: notificacion.movimiento_id,
            Fecha: HoraDeArgentina.DesdeUtc(notificacion.fecha));
}
