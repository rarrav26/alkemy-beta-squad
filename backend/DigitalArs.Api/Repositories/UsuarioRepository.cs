using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Repositories;

public class UsuarioRepository(DigitalArsDbContext context) : IUsuarioRepository
{
    public Task<Usuario?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        context.Usuarios.AsNoTracking()
            .SingleOrDefaultAsync(usuario => usuario.id == id, cancellationToken);

    public Task<Usuario?> GetByIdentityUserIdAsync(string identityUserId, CancellationToken cancellationToken = default) =>
        context.Usuarios.AsNoTracking()
            .SingleOrDefaultAsync(usuario => usuario.identity_user_id == identityUserId, cancellationToken);

    public async Task<bool> ActualizarEstadoActivoAsync(int id, bool activo, CancellationToken cancellationToken = default)
    {
        // Se vuelve a buscar con seguimiento porque esta es la única operación que escribe.
        var perfil = await context.Usuarios.SingleOrDefaultAsync(usuario => usuario.id == id, cancellationToken);
        if (perfil is null) return false;

        perfil.is_active = activo;
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateProfileAsync(int id, string nombre, string apellido, string email, CancellationToken cancellationToken = default)
    {
        var perfil = await context.Usuarios.SingleOrDefaultAsync(usuario => usuario.id == id, cancellationToken);
        if (perfil is null) return false;

        perfil.nombre = nombre;
        perfil.apellido = apellido;
        perfil.email = email;

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
