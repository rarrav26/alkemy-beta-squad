using DigitalArs.Api.Data.Entities;

namespace DigitalArs.Api.Interfaces;

public interface IUsuarioRepository
{
    // Las dos consultas son de solo lectura y usan AsNoTracking: el único cambio que se
    // persiste sobre un perfil es el estado activo, y ese lo hace el método de abajo.
    Task<Usuario?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Usuario?> GetByIdentityUserIdAsync(string identityUserId, CancellationToken cancellationToken = default);

    // Devuelve false si no existe un perfil con ese id. Guarda el cambio adentro, así quien
    // llama no necesita saber que detrás hay un DbContext.
    Task<bool> ActualizarEstadoActivoAsync(int id, bool activo, CancellationToken cancellationToken = default);
}
