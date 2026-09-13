using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Repositories;

public class UsuarioRepository(DigitalArsDbContext context) : IUsuarioRepository
{
    public Task<Usuario?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        context.Usuarios.FindAsync([id], cancellationToken).AsTask();

    public Task<Usuario?> GetByIdentityUserIdAsync(string identityUserId, CancellationToken cancellationToken = default) =>
        context.Usuarios.AsNoTracking()
            .SingleOrDefaultAsync(usuario => usuario.identity_user_id == identityUserId, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
