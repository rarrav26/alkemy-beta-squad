using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Hubs;
using DigitalArs.Api.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace DigitalArs.Api.Services;

public class NotificadorSignalR(
    IHubContext<NotificacionesHub> hub,
    ILogger<NotificadorSignalR> logger) : INotificadorEnTiempoReal
{
    // El nombre del método que escucha el frontend. Tiene que coincidir letra por letra con el
    // connection.on('NuevaNotificacion', ...) del cliente: si no coincide, SignalR no avisa
    // nada, simplemente no llega.
    private const string EventoDelCliente = "NuevaNotificacion";

    public async Task EnviarAsync(string? identityUserId, Notificacion notificacion)
    {
        if (string.IsNullOrWhiteSpace(identityUserId))
            return;

        try
        {
            // Clients.User(...) le llega a TODAS las conexiones abiertas de esa persona: si
            // tiene la app en el celular y en dos pestañas, las tres reciben el aviso. SignalR
            // mantiene esa relación por su cuenta, y el id que usa es el del claim
            // NameIdentifier del token, que es el mismo identity_user_id de la base.
            //
            // Si la persona no está conectada, esto no falla: no hay nadie a quien entregarle
            // y el aviso queda esperando en la campana.
            await hub.Clients
                .User(identityUserId)
                .SendAsync(EventoDelCliente, NotificacionResponse.Desde(notificacion));
        }
        catch (Exception error)
        {
            // Se atrapa acá y no en cada servicio que llama: así depositar y transferir no
            // repiten el try/catch, y nadie puede olvidarse de ponerlo. Un problema de SignalR
            // no puede tumbar una operación que ya está confirmada en la base.
            logger.LogWarning(
                error,
                "No se pudo enviar la notificación {Id} en tiempo real. Queda guardada y el usuario la ve en la campana.",
                notificacion.id);
        }
    }
}
