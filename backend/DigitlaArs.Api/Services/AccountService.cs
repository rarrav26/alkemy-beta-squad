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

    // Palabras simples para armar el alias autogenerado (ejemplo: auto.perro.gato).
    private static readonly string[] PalabrasParaAlias =
    [
        "auto", "perro", "gato", "sol", "luna", "mar", "rio", "arbol",
        "flor", "nube", "pan", "queso", "libro", "silla", "mesa", "puerta",
        "campo", "monte", "cielo", "tierra", "fuego", "agua", "viento", "nieve"
    ];

    private const int IntentosParaGenerarAlias = 10;

    // Los primeros 10 dígitos identifican a la entidad; los 12 restantes son el número de cuenta.
    private const string PrefijoCvu = "0000003100";

    public async Task<(IdentityUser? User, Usuario? Profile, Cuenta? Cuenta, string[] Errors)> CreateAsync(
        UserProfileDto dto, string? password, string role = "Usuario")
    {
        // Both contexts share a scoped SQL connection and one transaction.
        await using var transaction = await auth.Database.BeginTransactionAsync();
        await db.Database.UseTransactionAsync(transaction.GetDbTransaction());
        try
        {
            var email = dto.Email.Trim();
            var tipoDoc = dto.TipoDocumento.Trim();
            var nroDoc = dto.NroDocumento.Trim();

            // Validación: Email duplicado
            if (await users.FindByEmailAsync(email) != null || await db.Usuarios.AnyAsync(u => u.email == email))
            {
                return (null, null, null, ["el email ya esta en uso"]);
            }

            // Validación: Tipo y número de documento duplicados
            if (await db.Usuarios.AnyAsync(u => u.tipo_documento == tipoDoc && u.nro_documento == nroDoc))
            {
                return (null, null, null, ["El documento ya se encuentra registrado."]);
            }

            var user = new IdentityUser { UserName = email, Email = email };
            var result = password is null ? await users.CreateAsync(user) : await users.CreateAsync(user, password);
            if (!result.Succeeded) return (null, null, null, Errors(result));

            result = await users.AddToRoleAsync(user, role);
            if (!result.Succeeded) return (null, null, null, Errors(result));

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

            // La cuenta en pesos es para quien opera en la billetera; el administrador no la necesita.
            Cuenta? cuenta = null;
            if (role == "Usuario")
            {
                var alias = await GenerarAliasDisponibleAsync();
                if (alias is null) return (null, null, null, ["No se pudo generar el alias de la cuenta. Intentá nuevamente."]);

                cuenta = new Cuenta
                {
                    usuario_id = profile.id,
                    alias = alias,
                    cvu = GenerarCvu(profile.id),
                    saldo = 0
                };
                db.Cuentas.Add(cuenta);
                await db.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return (user, profile, cuenta, []);
        }
        catch (DbUpdateException)
        {
            return (null, null, null, ["No se pudo registrar el usuario con los datos proporcionados."]);
        }
        finally
        {
            await db.Database.UseTransactionAsync(null);
        }
    }

    // El id del usuario ya es único, así que sirve como número de cuenta sin repetir ni sortear.
    private static string GenerarCvu(int usuarioId) => PrefijoCvu + usuarioId.ToString("D12");

    private static string SortearTresPalabras()
    {
        var primera = PalabrasParaAlias[Random.Shared.Next(PalabrasParaAlias.Length)];
        var segunda = PalabrasParaAlias[Random.Shared.Next(PalabrasParaAlias.Length)];
        var tercera = PalabrasParaAlias[Random.Shared.Next(PalabrasParaAlias.Length)];
        return primera + "." + segunda + "." + tercera;
    }

    // Devuelve null si después de varios intentos todas las combinaciones sorteadas ya estaban tomadas.
    private async Task<string?> GenerarAliasDisponibleAsync()
    {
        for (var intento = 0; intento < IntentosParaGenerarAlias; intento++)
        {
            var alias = SortearTresPalabras();
            if (!await db.Cuentas.AnyAsync(c => c.alias == alias)) return alias;
        }
        return null;
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
