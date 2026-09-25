using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Results;
using DigitalArs.Api.Interfaces;

namespace DigitalArs.Api.Services;

public class CuentaService(
    IUsuarioRepository usuarios,
    ICuentaRepository cuentas) : ICuentaService
{
    public async Task<Resultado<CuentaResponse>> ObtenerMiCuentaAsync(
        string identityUserId,
        CancellationToken cancellationToken = default)
    {
        var usuario = await usuarios.GetByIdentityUserIdAsync(
            identityUserId,
            cancellationToken);

        if (usuario is null)
        {
            return Resultado<CuentaResponse>.Fallo(
                MotivoDeRechazo.NoEncontrado,
                "No se encontró el usuario.");
        }

        if (!usuario.is_active)
        {
            return Resultado<CuentaResponse>.Fallo(
                MotivoDeRechazo.UsuarioDesactivado,
                "Tu usuario está desactivado.");
        }

        var cuenta = await cuentas.GetByUsuarioIdAsync(
            usuario.id,
            cancellationToken);

        if (cuenta is null)
        {
            return Resultado<CuentaResponse>.Fallo(
                MotivoDeRechazo.CuentaNoEncontrada,
                "No tenés una cuenta asociada.");
        }

        var respuesta = new CuentaResponse(
            Id: cuenta.id,
            Alias: cuenta.alias,
            Cvu: cuenta.cvu,
            Saldo: cuenta.saldo);

        return Resultado<CuentaResponse>.Exito(respuesta);
    }
}