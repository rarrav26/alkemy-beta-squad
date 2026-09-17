using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Services;

public class TransferenciaService(
    ICuentaRepository cuentas,
    IUsuarioRepository usuarios,
    DigitalArsDbContext context) : ITransferenciaService
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

        var cuentaDestino = await cuentas.GetByAliasOCvuAsync(destino, cancellationToken);

        if (cuentaDestino is null)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.DestinoNoEncontrado,
                "No se encontró ninguna cuenta con ese alias o CVU.");
        }

        if (cuentaDestino.id == cuentaOrigen.id)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.MismaCuenta,
                "No podés transferir dinero a tu propia cuenta.");
        }

        if (cuentaDestino.usuario is null || !cuentaDestino.usuario.is_active)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.UsuarioDesactivado,
                "La cuenta destino no pertenece a un usuario activo.");
        }

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

    public async Task<Resultado<TransferenciaResponseDto>> TransferirAsync(
        string identityUserId,
        TransferenciaDto dto,
        CancellationToken cancellationToken = default)
    {
        var destino = (dto.Destino ?? "").Trim();

        if (dto.Importe is not decimal importe)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.DatosInvalidos, "El importe es obligatorio.");

        var errorDeImporte = LimitesDeImporte.PrimerErrorDe(importe);
        if (errorDeImporte is not null)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.DatosInvalidos, errorDeImporte);

        var usuarioOrigen = await usuarios.GetByIdentityUserIdAsync(identityUserId, cancellationToken);
        if (usuarioOrigen is null)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.NoEncontrado, "No se encontró el usuario emisor.");

        if (!usuarioOrigen.is_active)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.UsuarioDesactivado, "Tu usuario se encuentra desactivado.");

        var cuentaOrigen = await context.Cuentas
            .SingleOrDefaultAsync(c => c.usuario_id == usuarioOrigen.id, cancellationToken);

        if (cuentaOrigen is null)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.CuentaNoEncontrada, "No tenés una cuenta asociada.");

        var cuentaDestino = await context.Cuentas
            .Include(c => c.usuario)
            .SingleOrDefaultAsync(c => c.alias == destino || c.cvu == destino, cancellationToken);

        if (cuentaDestino is null)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.DestinoNoEncontrado, "No se encontró ninguna cuenta con ese alias o CVU.");

        if (cuentaDestino.id == cuentaOrigen.id)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.MismaCuenta, "No podés transferir dinero a tu propia cuenta.");

        if (cuentaDestino.usuario is null || !cuentaDestino.usuario.is_active)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.UsuarioDesactivado, "La cuenta destino no pertenece a un usuario activo.");

        if (cuentaOrigen.saldo < importe)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.SaldoInsuficiente, "Saldo insuficiente para realizar la transferencia.");

        cuentaOrigen.saldo -= importe;
        cuentaDestino.saldo += importe;

        var fechaOperacion = DateTime.UtcNow;

        var movDebito = new Movimiento
        {
            cuenta_id = cuentaOrigen.id,
            tipo_movimiento_id = 2, // TRANSFERENCIA_ENVIADA
            importe = importe,
            fecha = fechaOperacion
        };

        var movCredito = new Movimiento
        {
            cuenta_id = cuentaDestino.id,
            tipo_movimiento_id = 3, // TRANSFERENCIA_RECIBIDA
            importe = importe,
            fecha = fechaOperacion
        };

        context.Movimientos.Add(movDebito);
        context.Movimientos.Add(movCredito);

        await context.SaveChangesAsync(cancellationToken);

        if (movDebito.transferencia_id == null || movDebito.transferencia_id == 0)
        {
            movDebito.transferencia_id = movDebito.id;
            movCredito.transferencia_id = movDebito.id;
            await context.SaveChangesAsync(cancellationToken);
        }

        return Resultado<TransferenciaResponseDto>.Exito(new TransferenciaResponseDto(cuentaOrigen.saldo));
    }
}