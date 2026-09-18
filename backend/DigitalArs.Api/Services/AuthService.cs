using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace DigitalArs.Api.Services;

public class AuthService(
    UserManager<IdentityUser> users,
    IUsuarioRepository usuarios,
    ITokenService tokens) : IAuthService
{
    public async Task<Resultado<SesionResponse>> LoginAsync(
        InicioSesionDto dto, CancellationToken cancellationToken = default)
    {
        var usuarioIdentity = await users.FindByEmailAsync(dto.Email.Trim());
        if (usuarioIdentity is null) return Rechazo(MotivoDeRechazo.CredencialesInvalidas);
        if (await users.IsLockedOutAsync(usuarioIdentity)) return Rechazo(MotivoDeRechazo.CredencialesInvalidas);

        if (!await users.HasPasswordAsync(usuarioIdentity)) return Rechazo(MotivoDeRechazo.FaltaDefinirPassword);

        if (!await users.CheckPasswordAsync(usuarioIdentity, dto.Password))
        {
            await users.AccessFailedAsync(usuarioIdentity);
            return Rechazo(MotivoDeRechazo.CredencialesInvalidas);
        }

        var perfil = await usuarios.GetByIdentityUserIdAsync(usuarioIdentity.Id, cancellationToken);
        if (perfil is null) return Rechazo(MotivoDeRechazo.CredencialesInvalidas);

        // Se permite el inicio de sesión aunque el usuario no esté activo;
        // el bloqueo operativo se gestiona en las acciones individuales.

        await users.ResetAccessFailedCountAsync(usuarioIdentity);
        return Resultado<SesionResponse>.Exito(await tokens.CrearToken(usuarioIdentity, perfil.id));
    }

    public async Task<Resultado<SesionResponse>> DefinirPrimeraPasswordAsync(
        PrimeraPasswordDto dto, CancellationToken cancellationToken = default)
    {
        var usuarioIdentity = await users.FindByEmailAsync(dto.Email.Trim());
        if (usuarioIdentity is null) return Rechazo(MotivoDeRechazo.InvitacionInvalida);

        if (await users.HasPasswordAsync(usuarioIdentity)) return Rechazo(MotivoDeRechazo.InvitacionInvalida);
        if (!await EsInvitacionValidaAsync(usuarioIdentity, dto.InvitationToken))
            return Rechazo(MotivoDeRechazo.InvitacionInvalida);

        var perfil = await usuarios.GetByIdentityUserIdAsync(usuarioIdentity.Id, cancellationToken);
        if (perfil is null) return Rechazo(MotivoDeRechazo.InvitacionInvalida);
        if (!perfil.is_active) return Rechazo(MotivoDeRechazo.UsuarioDesactivado);

        var passwordDefinida = await users.AddPasswordAsync(usuarioIdentity, dto.Password);
        if (!passwordDefinida.Succeeded)
            return Resultado<SesionResponse>.Fallo(
                MotivoDeRechazo.DatosInvalidos, MensajesDeIdentity.Traducir(passwordDefinida));

        return Resultado<SesionResponse>.Exito(await tokens.CrearToken(usuarioIdentity, perfil.id));
    }

    public async Task<PerfilResponse?> ObtenerPerfilAsync(
        string identityUserId, CancellationToken cancellationToken = default)
    {
        var usuarioIdentity = await users.FindByIdAsync(identityUserId);
        if (usuarioIdentity is null) return null;

        var perfil = await usuarios.GetByIdentityUserIdAsync(identityUserId, cancellationToken);
        if (perfil is null) return null;

        var roles = await users.GetRolesAsync(usuarioIdentity);
        return new PerfilResponse(
            perfil.id, perfil.nombre, perfil.apellido, perfil.email, RolPrincipal.DeLosRoles(roles));
    }

    private Task<bool> EsInvitacionValidaAsync(IdentityUser usuarioIdentity, string invitationToken) =>
        users.VerifyUserTokenAsync(
            usuarioIdentity, TokenOptions.DefaultProvider, Invitacion.Proposito, invitationToken);

    private static Resultado<SesionResponse> Rechazo(MotivoDeRechazo motivo) =>
        Resultado<SesionResponse>.Fallo(motivo);
}