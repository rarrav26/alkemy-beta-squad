using DigitalArs.Api.Data.Entities;

namespace DigitalArs.Api.Interfaces;

// Acceso a las notificaciones de un usuario.
//
// Todos los métodos reciben usuarioId (el de la tabla Usuarios, no el de Identity) y filtran
// por él. Ese filtro es lo que garantiza que nadie vea ni modifique las notificaciones de otro:
// la regla vive acá, en la consulta, y no en un chequeo posterior que se pueda olvidar.
public interface INotificacionRepository
{
    // Guarda la notificación y confirma el cambio, igual que IMovimientoRepository.AddAsync.
    // Si quien llama tiene una transacción abierta sobre el mismo DbContext, este guardado
    // entra en esa transacción y se revierte con ella.
    Task AddAsync(
        Notificacion notificacion,
        CancellationToken cancellationToken = default);

    // Las más recientes primero. No hay paginación: el panel muestra una tanda y con eso
    // alcanza para lo que pide la historia de usuario.
    Task<IReadOnlyList<Notificacion>> ListarUltimasAsync(
        int usuarioId,
        int cantidad,
        CancellationToken cancellationToken = default);

    // Para el globito. Cuenta TODAS las no leídas, no solo las que trae ListarUltimasAsync.
    Task<int> ContarNoLeidasAsync(
        int usuarioId,
        CancellationToken cancellationToken = default);

    // Devuelve false si esa notificación no existe o es de otro usuario. Quien llama traduce
    // las dos situaciones al mismo 404, para no revelar que el id existe.
    Task<bool> MarcarLeidaAsync(
        int id,
        int usuarioId,
        CancellationToken cancellationToken = default);

    Task MarcarTodasLeidasAsync(
        int usuarioId,
        CancellationToken cancellationToken = default);
}
