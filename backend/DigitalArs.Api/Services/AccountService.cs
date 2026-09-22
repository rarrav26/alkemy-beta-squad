using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace DigitalArs.Api.Services;

public class AccountService(
    AuthDbContext auth,
    DigitalArsDbContext db,
    UserManager<IdentityUser> users,
    IUsuarioRepository usuarios,
    ICuentaRepository cuentas) : IAccountService
{
    private const int IntentosParaGenerarAlias = 10;

    public async Task<Resultado<RegistroResponse>> RegistrarAsync(RegistroDto dto)
    {
        var alta = await CrearEnTransaccionAsync(dto, dto.Password);
        if (!alta.Exitoso) return Resultado<RegistroResponse>.Fallo(MotivoDeRechazo.DatosInvalidos, alta.Errores);

        // El autorregistro siempre crea con el rol Usuario, y ese rol siempre lleva cuenta en pesos.
        var cuenta = alta.Cuenta!;
        return Resultado<RegistroResponse>.Exito(new RegistroResponse(
            Message: "Usuario registrado exitosamente.",
            Email: alta.UsuarioIdentity!.Email,
            Alias: cuenta.alias,
            Cvu: cuenta.cvu,
            Saldo: cuenta.saldo));
    }

    public async Task<Resultado<UsuarioCreadoResponse>> CrearConInvitacionAsync(PerfilUsuarioDto dto)
    {
        var alta = await CrearEnTransaccionAsync(dto, password: null);
        if (!alta.Exitoso) return Resultado<UsuarioCreadoResponse>.Fallo(MotivoDeRechazo.DatosInvalidos, alta.Errores);

        var usuarioIdentity = alta.UsuarioIdentity!;
        return Resultado<UsuarioCreadoResponse>.Exito(new UsuarioCreadoResponse(
            UsuarioId: alta.Perfil!.id,
            Email: usuarioIdentity.Email,
            RequiresPasswordSetup: true,
            InvitationToken: await GenerarInvitacionAsync(usuarioIdentity),
            ExpiresInSeconds: Invitacion.ExpiraEnSegundos));
    }

    public async Task<Resultado<InvitacionResponse>> ReemitirInvitacionAsync(
        int usuarioId, CancellationToken cancellationToken = default)
    {
        var perfil = await usuarios.GetByIdAsync(usuarioId, cancellationToken);
        if (perfil?.identity_user_id is null) return Resultado<InvitacionResponse>.Fallo(MotivoDeRechazo.NoEncontrado);

        var usuarioIdentity = await users.FindByIdAsync(perfil.identity_user_id);
        if (usuarioIdentity is null) return Resultado<InvitacionResponse>.Fallo(MotivoDeRechazo.NoEncontrado);

        var puedeRecibirInvitacion = perfil.is_active && !await users.HasPasswordAsync(usuarioIdentity);
        if (!puedeRecibirInvitacion)
            return Resultado<InvitacionResponse>.Fallo(MotivoDeRechazo.NoPuedeRecibirInvitacion);

        // Renovar el stamp invalida la invitación anterior, así queda una sola vigente.
        var rotado = await users.UpdateSecurityStampAsync(usuarioIdentity);
        if (!rotado.Succeeded) return Resultado<InvitacionResponse>.Fallo(MotivoDeRechazo.NoSePudoActualizar);

        return Resultado<InvitacionResponse>.Exito(new InvitacionResponse(
            Email: usuarioIdentity.Email,
            RequiresPasswordSetup: true,
            InvitationToken: await GenerarInvitacionAsync(usuarioIdentity),
            ExpiresInSeconds: Invitacion.ExpiraEnSegundos));
    }

    public async Task<MotivoDeRechazo?> CambiarEstadoAsync(
        int usuarioId, bool activo, CancellationToken cancellationToken = default)
    {
        var perfil = await usuarios.GetByIdAsync(usuarioId, cancellationToken);
        if (perfil is null) return MotivoDeRechazo.NoEncontrado;

        if (!await RevocarSesionesAsync(perfil)) return MotivoDeRechazo.NoSePudoActualizar;

        if (!await usuarios.ActualizarEstadoActivoAsync(usuarioId, activo, cancellationToken))
            return MotivoDeRechazo.NoEncontrado;

        return null;
    }

    public async Task<bool> ExisteAdministradorAsync() =>
        (await users.GetUsersInRoleAsync(RolPrincipal.Administrador)).Count > 0;

    public async Task<Resultado<UsuarioResponse>> ObtenerPorIdAsync(
        int usuarioId, CancellationToken cancellationToken = default)
    {
        var perfil = await usuarios.GetByIdAsync(usuarioId, cancellationToken);
        if (perfil is null)
            return Resultado<UsuarioResponse>.Fallo(MotivoDeRechazo.NoEncontrado, "No se encontró el usuario.");

        var cuenta = await cuentas.GetByUsuarioIdAsync(perfil.id, cancellationToken);

        var respuesta = new UsuarioResponse(
            UsuarioId: perfil.id,
            Nombre: perfil.nombre,
            Apellido: perfil.apellido,
            TipoDocumento: perfil.tipo_documento,
            NroDocumento: perfil.nro_documento,
            Email: perfil.email,
            IsActive: perfil.is_active,
            Cuenta: cuenta is null ? null : new CuentaResponse(
                Id: cuenta.id,
                Alias: cuenta.alias,
                Cvu: cuenta.cvu,
                Saldo: cuenta.saldo)
        );

        return Resultado<UsuarioResponse>.Exito(respuesta);
    }

    public async Task<Resultado<UsuarioResponse>> UpdateProfileAsync(
        string identityUserId, DTOs.UpdateProfileDto dto, CancellationToken cancellationToken = default)
    {
        // Obtener perfil
        var perfil = await usuarios.GetByIdentityUserIdAsync(identityUserId, cancellationToken);
        if (perfil is null)
            return Resultado<UsuarioResponse>.Fallo(MotivoDeRechazo.NoEncontrado, "No se encontró el usuario.");

        // Si email cambia, validar unicidad en Identity
        var emailLower = dto.Email.Trim();
        var emailChanged = !string.Equals(perfil.email, emailLower, StringComparison.OrdinalIgnoreCase);
        if (emailChanged)
        {
            var existenteIdentity = await users.FindByEmailAsync(emailLower);
            if (existenteIdentity is not null && existenteIdentity.Id != identityUserId)
                return Resultado<UsuarioResponse>.Fallo(MotivoDeRechazo.DatosInvalidos, new[] { "El email ya está en uso." });

            // también chequear en tabla usuarios por si hay otro perfil con mismo email
            var otroPerfil = await db.Usuarios.AsNoTracking().SingleOrDefaultAsync(u => u.email == emailLower, cancellationToken);
            if (otroPerfil is not null && otroPerfil.identity_user_id != identityUserId)
                return Resultado<UsuarioResponse>.Fallo(MotivoDeRechazo.DatosInvalidos, new[] { "El email ya está en uso." });
        }

        // Si el email cambia, actualizamos también IdentityUser cuando corresponda.
        if (emailChanged && perfil.identity_user_id is not null)
        {
            var usuarioIdentity = await users.FindByIdAsync(perfil.identity_user_id);
            if (usuarioIdentity is null)
                return Resultado<UsuarioResponse>.Fallo(MotivoDeRechazo.NoEncontrado, "No se encontró el usuario de identidad.");

            // Re-autenticación: exigir contraseña actual para cambiar el email
            if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
                return Resultado<UsuarioResponse>.Fallo(MotivoDeRechazo.DatosInvalidos, new[] { "Se requiere la contraseña actual para cambiar el email." });

            var passwordValido = await users.CheckPasswordAsync(usuarioIdentity, dto.CurrentPassword);
            if (!passwordValido)
                return Resultado<UsuarioResponse>.Fallo(MotivoDeRechazo.DatosInvalidos, new[] { "Contraseña actual incorrecta." });

            usuarioIdentity.Email = emailLower;
            usuarioIdentity.UserName = emailLower;
            var actualizado = await users.UpdateAsync(usuarioIdentity);
            if (!actualizado.Succeeded)
                return Resultado<UsuarioResponse>.Fallo(MotivoDeRechazo.NoSePudoActualizar, new[] { "No se pudo actualizar el email." });
        }

        // Actualizar perfil en la tabla de negocio
        var actualizadoPerfil = await usuarios.UpdateProfileAsync(perfil.id, dto.Nombre.Trim(), dto.Apellido.Trim(), emailLower, cancellationToken);
        if (!actualizadoPerfil)
            return Resultado<UsuarioResponse>.Fallo(MotivoDeRechazo.NoSePudoActualizar, new[] { "No se pudo actualizar el perfil." });

        // Devolver perfil actualizado
        var perfilNuevo = await usuarios.GetByIdAsync(perfil.id, cancellationToken);
        var cuenta = await cuentas.GetByUsuarioIdAsync(perfil.id, cancellationToken);

        var respuesta = new UsuarioResponse(
            UsuarioId: perfilNuevo!.id,
            Nombre: perfilNuevo.nombre,
            Apellido: perfilNuevo.apellido,
            TipoDocumento: perfilNuevo.tipo_documento,
            NroDocumento: perfilNuevo.nro_documento,
            Email: perfilNuevo.email,
            IsActive: perfilNuevo.is_active,
            Cuenta: cuenta is null ? null : new CuentaResponse(cuenta.id, cuenta.alias, cuenta.cvu, cuenta.saldo)
        );

        return Resultado<UsuarioResponse>.Exito(respuesta);
    }

    public async Task<Resultado<CuentaResponse>> UpdateAliasAsync(
        string identityUserId, string newAlias, CancellationToken cancellationToken = default)
    {
        var perfil = await usuarios.GetByIdentityUserIdAsync(identityUserId, cancellationToken);
        if (perfil is null) return Resultado<CuentaResponse>.Fallo(MotivoDeRechazo.NoEncontrado, "No se encontró el usuario.");

        var aliasTrim = newAlias.Trim();
        // Formato: solo letras
        if (!System.Text.RegularExpressions.Regex.IsMatch(aliasTrim, "^[A-Za-z]+$"))
            return Resultado<CuentaResponse>.Fallo(MotivoDeRechazo.DatosInvalidos, new[] { "Formato de alias inválido. Sólo se permiten letras." });

        // Unicidad: buscar por alias (GetByAliasOCvuAsync también busca CVU)
        var existente = await cuentas.GetByAliasOCvuAsync(aliasTrim, cancellationToken);
        if (existente is not null && existente.usuario_id != perfil.id)
            return Resultado<CuentaResponse>.Fallo(MotivoDeRechazo.DatosInvalidos, new[] { "El alias ya está en uso." });

        var ok = await cuentas.UpdateAliasAsync(perfil.id, aliasTrim, cancellationToken);
        if (!ok) return Resultado<CuentaResponse>.Fallo(MotivoDeRechazo.NoSePudoActualizar, new[] { "No se pudo actualizar el alias." });

        var cuenta = await cuentas.GetByUsuarioIdAsync(perfil.id, cancellationToken);
        if (cuenta is null) return Resultado<CuentaResponse>.Fallo(MotivoDeRechazo.CuentaNoEncontrada, "No se encontró la cuenta.");

        var respuesta = new CuentaResponse(cuenta.id, cuenta.alias, cuenta.cvu, cuenta.saldo);
        return Resultado<CuentaResponse>.Exito(respuesta);
    }



    public async Task<Resultado<UsuarioResponse>> ObtenerPorIdentityUserIdAsync(
        string identityUserId, CancellationToken cancellationToken = default)
    {
        var perfil = await usuarios.GetByIdentityUserIdAsync(identityUserId, cancellationToken);
        if (perfil is null)
            return Resultado<UsuarioResponse>.Fallo(MotivoDeRechazo.NoEncontrado, "No se encontró el usuario.");

        var cuenta = await cuentas.GetByUsuarioIdAsync(perfil.id, cancellationToken);

        var respuesta = new UsuarioResponse(
            UsuarioId: perfil.id,
            Nombre: perfil.nombre,
            Apellido: perfil.apellido,
            TipoDocumento: perfil.tipo_documento,
            NroDocumento: perfil.nro_documento,
            Email: perfil.email,
            IsActive: perfil.is_active,
            Cuenta: cuenta is null ? null : new CuentaResponse(
                Id: cuenta.id,
                Alias: cuenta.alias,
                Cvu: cuenta.cvu,
                Saldo: cuenta.saldo)
        );

        return Resultado<UsuarioResponse>.Exito(respuesta);
    }

    public async Task<PaginaResponse<UsuarioAdminItemDto>> ObtenerUsuariosPaginadosAsync(
    int page,
    int pageSize,
    CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 10 : pageSize;

        // 1. Obtenemos los IDs de Identity que tienen rol Administrador
        var admins = await users.GetUsersInRoleAsync(RolPrincipal.Administrador);
        var adminIdentityIds = admins.Select(a => a.Id).ToList();

        // 2. Armamos la consulta filtrando al admin por email y por ID de Identity
        var query = db.Usuarios
            .AsNoTracking()
            .Where(u => u.email != "admin@digitalars.com");

        if (adminIdentityIds.Count > 0)
        {
            query = query.Where(u => u.identity_user_id == null || !adminIdentityIds.Contains(u.identity_user_id));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = await query
            .OrderBy(u => u.id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UsuarioAdminItemDto(
                u.id,
                u.nombre,
                u.apellido,
                u.email,
                u.tipo_documento,
                u.nro_documento,
                u.is_active
            ))
            .ToListAsync(cancellationToken);

        return new PaginaResponse<UsuarioAdminItemDto>(items, page, pageSize, totalItems, totalPages);
    }

    // Se revoca primero y se guarda después: si el guardado del perfil falla, los tokens viejos
    // ya dejaron de valer y no vuelven a servir cuando se reactive al usuario.
    private async Task<bool> RevocarSesionesAsync(Usuario perfil)
    {
        if (perfil.identity_user_id is null) return true;

        var usuarioIdentity = await users.FindByIdAsync(perfil.identity_user_id);
        if (usuarioIdentity is null) return true;

        var rotado = await users.UpdateSecurityStampAsync(usuarioIdentity);
        return rotado.Succeeded;
    }

    private Task<string> GenerarInvitacionAsync(IdentityUser usuarioIdentity) =>
        users.GenerateUserTokenAsync(usuarioIdentity, TokenOptions.DefaultProvider, Invitacion.Proposito);

    private async Task<ResultadoDeAlta> CrearEnTransaccionAsync(PerfilUsuarioDto dto, string? password)
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
        if (!alta.Succeeded) return ResultadoDeAlta.Fallo(MensajesDeIdentity.Traducir(alta));

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

        return await users.AddToRoleAsync(usuarioIdentity, RolPrincipal.Usuario);
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
}