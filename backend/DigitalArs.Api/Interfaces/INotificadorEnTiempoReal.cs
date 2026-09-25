using DigitalArs.Api.Data.Entities;

namespace DigitalArs.Api.Interfaces;

// Avisarle al usuario en el momento, sin que recargue la página.
//
// Los servicios de negocio dependen de esta interfaz y no de SignalR: depositar y transferir no
// tienen por qué saber si el aviso viaja por WebSocket, por email o por nada. También es lo que
// permite reemplazarlo por una implementación de mentira en un test.
//
// IMPORTANTE: quien implemente esto NO puede propagar excepciones. El envío siempre ocurre
// después de que la operación se confirmó en la base, así que fallar acá significaría hacer
// fracasar una transferencia que ya pasó. Si el aviso no sale, el usuario lo ve igual en la
// campana la próxima vez que abra la app: la base es la fuente de verdad y esto es solo un
// atajo para que lo vea antes.
public interface INotificadorEnTiempoReal
{
    // identityUserId es nullable porque la columna de la base lo es. Con null no se envía nada.
    Task EnviarAsync(string? identityUserId, Notificacion notificacion);
}
