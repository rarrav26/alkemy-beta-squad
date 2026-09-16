using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;

namespace DigitalArs.Api.Services;

public class TransferenciaService(
    ICuentaRepository cuentas,
    IUsuarioRepository usuarios) : ITransferenciaService
{
    public async Task<Resultado<DestinoResponseDto>> ResolverDestinoAsync(
        string identityUserId,
        TransferenciaDto dto,
        CancellationToken cancellationToken = default)
    {
        var destino = (dto.Destino ?? "").Trim();

        if (dto.Importe is not decimal importe)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.DatosInvalidos,
                "El importe es obligatorio.");
        }

        var errorDeImporte = LimitesDeImporte.PrimerErrorDe(importe);

        if (errorDeImporte is not null)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.DatosInvalidos,
                errorDeImporte);
        }

        // 1. Obtener la cuenta del usuario autenticado (origen)
        var usuarioOrigen = await usuarios.GetByIdentityUserIdAsync(identityUserId, cancellationToken);
        if (usuarioOrigen is null)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.NoEncontrado,
                "No se encontró el usuario emisor.");
        }

        var cuentaOrigen = await cuentas.GetByUsuarioIdAsync(usuarioOrigen.id, cancellationToken);

        if (cuentaOrigen is null)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.CuentaNoEncontrada,
                "No tenés una cuenta asociada.");
        }

        // 2. Buscar cuenta destino
        var cuentaDestino = await cuentas.GetByAliasOCvuAsync(destino, cancellationToken);

        if (cuentaDestino is null)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.DestinoNoEncontrado,
                "No se encontró ninguna cuenta con ese alias o CVU.");
        }

        // 3. Validar que no sea la propia cuenta
        if (cuentaDestino.id == cuentaOrigen.id)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.MismaCuenta,
                "No podés transferir dinero a tu propia cuenta.");
        }

        // 4. Validar que el usuario destino esté activo
        if (cuentaDestino.usuario is null || !cuentaDestino.usuario.is_active)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.UsuarioDesactivado,
                "La cuenta destino no pertenece a un usuario activo.");
        }

        // 5. Validar saldo suficiente en origen
        if (cuentaOrigen.saldo < importe)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.SaldoInsuficiente,
                "Saldo insuficiente para realizar la transferencia.");
        }

        var respuesta = new DestinoResponseDto(
            Id: cuentaDestino.id,
            Alias: cuentaDestino.alias,
            Cvu: cuentaDestino.cvu);

        return Resultado<DestinoResponseDto>.Exito(respuesta);
    }
}