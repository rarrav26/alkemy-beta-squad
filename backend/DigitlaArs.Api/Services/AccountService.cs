using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitlaArs.Api.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
namespace DigitalArs.Api.Services;
public class AccountService(AuthDbContext auth, DigitalArsDbContext db, UserManager<IdentityUser> users)
{
    public const string InitialPasswordPurpose = "DigitalArs.InitialPassword.v1";

    public async Task<(IdentityUser? User, Usuario? Profile, string[] Errors)> CreateAsync(
        UserProfileDto dto, string? password, string role = "Usuario")
    {
        // Both contexts share a scoped SQL connection and one transaction.
        await using var transaction = await auth.Database.BeginTransactionAsync();
        await db.Database.UseTransactionAsync(transaction.GetDbTransaction());
        try
        {
            var email = dto.Email.Trim();
            if (await db.Usuarios.AnyAsync(u => u.email == email ||
                (u.tipo_documento == dto.TipoDocumento.Trim() && u.nro_documento == dto.NroDocumento.Trim())))
                return (null, null, ["No se pudo registrar el usuario con los datos proporcionados."]);
            var user = new IdentityUser { UserName = email, Email = email };
            var result = password is null ? await users.CreateAsync(user) : await users.CreateAsync(user, password);
            if (!result.Succeeded) return (null, null, Errors(result));
            result = await users.AddToRoleAsync(user, role);
            if (!result.Succeeded) return (null, null, Errors(result));
            var profile = new Usuario
            {
                identity_user_id = user.Id, nombre = dto.Nombre.Trim(), apellido = dto.Apellido.Trim(),
                email = email, tipo_documento = dto.TipoDocumento.Trim(), nro_documento = dto.NroDocumento.Trim(),
                is_active = true
            };
            db.Usuarios.Add(profile);
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            return (user, profile, []);
        }
        catch (DbUpdateException)
        {
            return (null, null, ["No se pudo registrar el usuario con los datos proporcionados."]);
        }
        finally { await db.Database.UseTransactionAsync(null); }
    }

    public Task<string> CreateInvitationAsync(IdentityUser user) =>
        users.GenerateUserTokenAsync(user, TokenOptions.DefaultProvider, InitialPasswordPurpose);

    public async Task<IdentityResult> SetInitialPasswordAsync(IdentityUser user, string token, string password)
    {
        if (await users.HasPasswordAsync(user) ||
            !await users.VerifyUserTokenAsync(user, TokenOptions.DefaultProvider, InitialPasswordPurpose, token))
            return IdentityResult.Failed(new IdentityError { Code = "InvalidInvitation", Description = "Invitación inválida o vencida." });
        // Hashes the password and rotates the security stamp. Concurrent reuse fails
        // Identity's concurrency check; an invitation cannot reset an existing password.
        return await users.AddPasswordAsync(user, password);
    }
    public static string[] Errors(IdentityResult result) => result.Errors.Select(e =>
        e.Code.StartsWith("Password") ? e.Description : "No se pudo completar la operación con los datos proporcionados.").ToArray();
}
