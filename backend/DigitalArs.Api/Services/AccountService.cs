using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace DigitalArs.Api.Services;

public class AccountService(AuthDbContext auth, DigitalArsDbContext db, UserManager<IdentityUser> users)
{
    public const string InitialPasswordPurpose = "DigitalArs.InitialPassword.v1";

    private const string RolUsuario = "Usuario";

    private const int IntentosParaGenerarAlias = 10;

    public async Task<ResultadoDeAlta> CreateAsync(PerfilUsuarioDto dto, string? password)
    {
        // Los dos contextos comparten la conexión scoped, así que entran en la misma transacción.
        // Si falla el perfil de negocio, tampoco queda creado el usuario de Identity.
        await using var transaccion = await auth.Database.BeginTransactionAsync();
        await db.Database.UseTransactionAsync(transaccion.GetDbTransaction());
        try
        {
            var resultado = await CrearUsuarioYCuentaAsync(dto, password);
            if (!resultado.Exitoso) return resultado;

            await transaccion.CommitAsync();
            return resultado;
        }
        catch (DbUpdateException)
        {
            return ResultadoDeAlta.Fallo("No se pudo registrar el usuario con los datos proporcionados.");
        }
        finally
        {
            await db.Database.UseTransactionAsync(null);
        }
    }

    private async Task<ResultadoDeAlta> CrearUsuarioYCuentaAsync(PerfilUsuarioDto dto, string? password)
    {
        QuitarEspaciosSobrantes(dto);

        var errorDeDuplicado = await BuscarErrorDeDuplicadoAsync(dto);
        if (errorDeDuplicado is not null) return ResultadoDeAlta.Fallo(errorDeDuplicado);

        var usuarioIdentity = new IdentityUser { UserName = dto.Email, Email = dto.Email };
        var alta = await CrearEnIdentityAsync(usuarioIdentity, password);
        if (!alta.Succeeded) return ResultadoDeAlta.Fallo(Errors(alta));

        var perfil = await GuardarPerfilAsync(dto, usuarioIdentity.Id);

        var cuenta = await CrearCuentaEnPesosAsync(perfil.id);
        if (cuenta is null) return ResultadoDeAlta.Fallo("No se pudo generar el alias de la cuenta. Intentá nuevamente.");

        return ResultadoDeAlta.Exito(usuarioIdentity, perfil, cuenta);
    }

    // Se normaliza una sola vez al principio para que el texto con el que se busca duplicados
    // sea exactamente el mismo que después se guarda.
    private static void QuitarEspaciosSobrantes(PerfilUsuarioDto dto)
    {
        dto.Nombre = dto.Nombre.Trim();
        dto.Apellido = dto.Apellido.Trim();
        dto.Email = dto.Email.Trim();
        dto.TipoDocumento = dto.TipoDocumento.Trim();
        dto.NroDocumento = dto.NroDocumento.Trim();
    }

    // Devuelve el mensaje del duplicado encontrado, o null si el email y el documento están libres.
    private async Task<string?> BuscarErrorDeDuplicadoAsync(PerfilUsuarioDto dto)
    {
        var estaEnIdentity = await users.FindByEmailAsync(dto.Email) is not null;
        if (estaEnIdentity || await db.Usuarios.AnyAsync(u => u.email == dto.Email))
            return "el email ya esta en uso";

        var documentoRegistrado = await db.Usuarios.AnyAsync(u =>
            u.tipo_documento == dto.TipoDocumento && u.nro_documento == dto.NroDocumento);
        if (documentoRegistrado)
            return "El documento ya se encuentra registrado.";

        return null;
    }

    private async Task<IdentityResult> CrearEnIdentityAsync(IdentityUser usuarioIdentity, string? password)
    {
        IdentityResult creado;
        // Sin contraseña, el usuario queda a la espera de consumir su invitación.
        if (password is null)
            creado = await users.CreateAsync(usuarioIdentity);
        else
            creado = await users.CreateAsync(usuarioIdentity, password);

        if (!creado.Succeeded) return creado;

        return await users.AddToRoleAsync(usuarioIdentity, RolUsuario);
    }

    private async Task<Usuario> GuardarPerfilAsync(PerfilUsuarioDto dto, string identityUserId)
    {
        var perfil = new Usuario
        {
            identity_user_id = identityUserId,
            nombre = dto.Nombre,
            apellido = dto.Apellido,
            email = dto.Email,
            tipo_documento = dto.TipoDocumento,
            nro_documento = dto.NroDocumento,
            is_active = true
        };
        db.Usuarios.Add(perfil);
        await db.SaveChangesAsync();
        return perfil;
    }

    // Devuelve null si no se consiguió un alias libre, y entonces el alta completo se cancela.
    private async Task<Cuenta?> CrearCuentaEnPesosAsync(int usuarioId)
    {
        var alias = await BuscarAliasLibreAsync();
        if (alias is null) return null;

        var cuenta = new Cuenta
        {
            usuario_id = usuarioId,
            alias = alias,
            cvu = DatosDeCuenta.CvuPara(usuarioId),
            saldo = 0
        };
        db.Cuentas.Add(cuenta);
        await db.SaveChangesAsync();
        return cuenta;
    }

    // Sortea alias hasta dar con uno que no esté tomado. Devuelve null si se acabaron los intentos.
    private async Task<string?> BuscarAliasLibreAsync()
    {
        for (var intento = 0; intento < IntentosParaGenerarAlias; intento++)
        {
            var alias = DatosDeCuenta.SortearAlias();
            if (!await db.Cuentas.AnyAsync(c => c.alias == alias)) return alias;
        }
        return null;
    }

    public Task<string> CreateInvitationAsync(IdentityUser user) =>
        users.GenerateUserTokenAsync(user, TokenOptions.DefaultProvider, InitialPasswordPurpose);

    public async Task<IdentityResult> SetInitialPasswordAsync(IdentityUser user, string token, string password)
    {
        if (await users.HasPasswordAsync(user))
            return InvitacionRechazada();

        if (!await users.VerifyUserTokenAsync(user, TokenOptions.DefaultProvider, InitialPasswordPurpose, token))
            return InvitacionRechazada();

        return await users.AddPasswordAsync(user, password);
    }

    public static string[] Errors(IdentityResult result) =>
        result.Errors.Select(MensajeSeguro).ToArray();

    private static IdentityResult InvitacionRechazada() =>
        IdentityResult.Failed(new IdentityError
        {
            Code = "InvalidInvitation",
            Description = "Invitación inválida o vencida."
        });

    // Los errores de contraseña se muestran tal cual porque ayudan a corregirla. El resto se
    // generaliza para no revelar si un email o un documento ya estaban registrados.
    private static string MensajeSeguro(IdentityError error)
    {
        if (error.Code.StartsWith("Password")) return error.Description;
        return "No se pudo completar la operación con los datos proporcionados.";
    }
}
