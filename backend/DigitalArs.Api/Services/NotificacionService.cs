using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Results;
using DigitalArs.Api.Interfaces;

namespace DigitalArs.Api.Services;

public class NotificacionService(
    IUsuarioRepository usuarios,
    INotificacionRepository notificaciones) : INotificacionService
{
    // Cuántas trae el panel de una vez. Sin paginación: la historia de usuario pide ver las
    // notificaciones y marcarlas, no recorrer el historial completo.
    private const int CantidadDelPanel = 30;

    public async Task<Resultado<NotificacionesResponse>> ListarAsync(
        string identityUserId,
        CancellationToken cancellationToken = default)
    {
        var acceso = await UsuarioActivoAsync(identityUserId, cancellationToken);

        if (!acceso.Exitoso)
        {
            return Resultado<NotificacionesResponse>.Fallo(
                acceso.Motivo!.Value,
                acceso.Errores);
        }

        var usuario = acceso.Valor!;

        var ultimas = await notificaciones.ListarUltimasAsync(
            usuario.id, CantidadDelPanel, cancellationToken);

        // El conteo va por separado y no se calcula sobre la lista de arriba: tiene que
        // contemplar también las no leídas que quedaron fuera de la tanda.
        var noLeidas = await notificaciones.ContarNoLeidasAsync(
            usuario.id, cancellationToken);

        var respuesta = new NotificacionesResponse(
            NoLeidas: noLeidas,
            Items: ultimas.Select(NotificacionResponse.Desde).ToList());

        return Resultado<NotificacionesResponse>.Exito(respuesta);
    }

    public async Task<MotivoDeRechazo?> MarcarLeidaAsync(
        string identityUserId,
        int id,
        CancellationToken cancellationToken = default)
    {
        var acceso = await UsuarioActivoAsync(identityUserId, cancellationToken);

        if (!acceso.Exitoso)
            return acceso.Motivo;

        var marcada = await notificaciones.MarcarLeidaAsync(
            id, acceso.Valor!.id, cancellationToken);

        // El repositorio devuelve false tanto si el id no existe como si es de otro usuario.
        // Las dos situaciones salen igual, y el controller las traduce al mismo 404.
        if (!marcada)
            return MotivoDeRechazo.NotificacionNoEncontrada;

        return null;
    }

    public async Task<MotivoDeRechazo?> MarcarTodasLeidasAsync(
        string identityUserId,
        CancellationToken cancellationToken = default)
    {
        var acceso = await UsuarioActivoAsync(identityUserId, cancellationToken);

        if (!acceso.Exitoso)
            return acceso.Motivo;

        await notificaciones.MarcarTodasLeidasAsync(
            acceso.Valor!.id, cancellationToken);

        return null;
    }

    // Traduce el usuario del token al perfil de la base y corta si no corresponde atenderlo.
    // Los tres métodos empiezan igual, así que la comprobación vive en un solo lugar.
    private async Task<Resultado<Usuario>> UsuarioActivoAsync(
        string identityUserId,
        CancellationToken cancellationToken)
    {
        var usuario = await usuarios.GetByIdentityUserIdAsync(
            identityUserId, cancellationToken);

        if (usuario is null)
        {
            return Resultado<Usuario>.Fallo(
                MotivoDeRechazo.NoEncontrado,
                "No se encontró el usuario.");
        }

        if (!usuario.is_active)
        {
            return Resultado<Usuario>.Fallo(
                MotivoDeRechazo.UsuarioDesactivado,
                "Tu usuario está desactivado.");
        }

        return Resultado<Usuario>.Exito(usuario);
    }
}
