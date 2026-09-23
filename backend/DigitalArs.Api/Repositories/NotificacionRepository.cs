using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Repositories;

public class NotificacionRepository(DigitalArsDbContext context)
    : INotificacionRepository
{
    public async Task AddAsync(
        Notificacion notificacion,
        CancellationToken cancellationToken = default)
    {
        await context.Notificaciones.AddAsync(
            notificacion,
            cancellationToken);

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Notificacion>> ListarUltimasAsync(
        int usuarioId,
        int cantidad,
        CancellationToken cancellationToken = default)
    {
        // El desempate por id importa: dos notificaciones de la misma transferencia se guardan
        // con la misma fecha, y sin él el orden entre ellas lo decide SQL Server y puede
        // cambiar entre consultas.
        return await context.Notificaciones
            .AsNoTracking()
            .Where(notificacion => notificacion.usuario_id == usuarioId)
            .OrderByDescending(notificacion => notificacion.fecha)
            .ThenByDescending(notificacion => notificacion.id)
            .Take(cantidad)
            .ToListAsync(cancellationToken);
    }

    public Task<int> ContarNoLeidasAsync(
        int usuarioId,
        CancellationToken cancellationToken = default)
    {
        return context.Notificaciones
            .CountAsync(
                notificacion =>
                    notificacion.usuario_id == usuarioId &&
                    !notificacion.leida,
                cancellationToken);
    }

    public async Task<bool> MarcarLeidaAsync(
        int id,
        int usuarioId,
        CancellationToken cancellationToken = default)
    {
        // A propósito NO se filtra por leida == false: marcar dos veces la misma notificación
        // tiene que seguir dando éxito. Si se filtrara, la segunda vez actualizaría cero filas
        // y el controller respondería 404 por algo que sí existe.
        var filasActualizadas = await context.Notificaciones
            .Where(notificacion =>
                notificacion.id == id &&
                notificacion.usuario_id == usuarioId)
            .ExecuteUpdateAsync(
                cambios => cambios.SetProperty(
                    notificacion => notificacion.leida,
                    true),
                cancellationToken);

        return filasActualizadas == 1;
    }

    public async Task MarcarTodasLeidasAsync(
        int usuarioId,
        CancellationToken cancellationToken = default)
    {
        // ExecuteUpdateAsync manda un solo UPDATE y no trae las filas a memoria: da igual si el
        // usuario tiene tres notificaciones o trescientas.
        await context.Notificaciones
            .Where(notificacion =>
                notificacion.usuario_id == usuarioId &&
                !notificacion.leida)
            .ExecuteUpdateAsync(
                cambios => cambios.SetProperty(
                    notificacion => notificacion.leida,
                    true),
                cancellationToken);
    }
}
