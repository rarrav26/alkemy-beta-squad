using DigitalArs.Api.Data.Entities;

namespace DigitalArs.Api.Interfaces;

public interface IUsuarioRepository
{
    // Con tracking: quien la llama puede necesitar modificar el perfil y guardarlo después.
    Task<Usuario?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    // Sin tracking: se usa solo para leer el perfil logueado, nunca se modifica.
    Task<Usuario?> GetByIdentityUserIdAsync(string identityUserId, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
