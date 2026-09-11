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
            if (role == "Administrador")
            {
                // Transaction-owned lock coordinates setup across API instances and CLI.
                await auth.Database.ExecuteSqlRawAsync("""
                    DECLARE @result int;
                    EXEC @result = sp_getapplock @Resource = 'DigitalArs.FirstAdmin',
                        @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 10000;
                    IF @result < 0 THROW 50002, 'No se pudo bloquear la configuración inicial.', 1;
                    """);
                if (await auth.UserRoles.AnyAsync(ur => auth.Roles.Any(r => r.Id == ur.RoleId && r.Name == "Administrador")))
                    return (null, null, ["SETUP_COMPLETED"]);
            }

            var email = dto.Email.Trim();
            var tipoDoc = dto.TipoDocumento.Trim();
            var nroDoc = dto.NroDocumento.Trim();

            // Validación: Email duplicado
            if (await users.FindByEmailAsync(email) != null || await db.Usuarios.AnyAsync(u => u.email == email))
            {
                return (null, null, ["el email ya esta en uso"]);
            }

            // Validación: Tipo y número de documento duplicados
            if (await db.Usuarios.AnyAsync(u => u.tipo_documento == tipoDoc && u.nro_documento == nroDoc))
            {
                return (null, null, ["El documento ya se encuentra registrado."]);
            }

            var user = new IdentityUser { UserName = email, Email = email };
            var result = password is null ? await users.CreateAsync(user) : await users.CreateAsync(user, password);
            if (!result.Succeeded) return (null, null, Errors(result));

            result = await users.AddToRoleAsync(user, role);
            if (!result.Succeeded) return (null, null, Errors(result));

            var profile = new Usuario
            {
                identity_user_id = user.Id,
                nombre = dto.Nombre.Trim(),
                apellido = dto.Apellido.Trim(),
                email = email,
                tipo_documento = tipoDoc,
                nro_documento = nroDoc,
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
        finally
        {
            await db.Database.UseTransactionAsync(null);
        }
    }

    public Task<string> CreateInvitationAsync(IdentityUser user) =>
        users.GenerateUserTokenAsync(user, TokenOptions.DefaultProvider, InitialPasswordPurpose);

    public async Task<IdentityResult> SetInitialPasswordAsync(IdentityUser user, string token, string password)
    {
        if (await users.HasPasswordAsync(user) ||
            !await users.VerifyUserTokenAsync(user, TokenOptions.DefaultProvider, InitialPasswordPurpose, token))
            return IdentityResult.Failed(new IdentityError { Code = "InvalidInvitation", Description = "Invitación inválida o vencida." });

        return await users.AddPasswordAsync(user, password);
    }

    public static string[] Errors(IdentityResult result) => result.Errors.Select(e =>
        e.Code.StartsWith("Password") ? e.Description : "No se pudo completar la operación con los datos proporcionados.").ToArray();
}