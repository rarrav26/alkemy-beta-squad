using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;

namespace DigitalArs.Api.Services;

public class DepositoService(
    DigitalArsDbContext db,
    IUsuarioRepository usuarios,
    ICuentaRepository cuentas,
    IMovimientoRepository movimientos,
    ITipoMovimientoRepository tipos) : IDepositoService
{
    public async Task<Resultado<DepositoResponse>> DepositarAsync(
        string identityUserId,
        DepositoDto dto,
        CancellationToken cancellationToken = default)
    {
        if (dto.Importe is not decimal importe)
        {
            return Fallo(
                MotivoDeRechazo.DatosInvalidos,
                "El importe es obligatorio.");
        }

        var errorDeImporte = LimitesDeImporte.PrimerErrorDe(importe);

        if (errorDeImporte is not null)
        {
            return Fallo(MotivoDeRechazo.DatosInvalidos, errorDeImporte);
        }

        var usuario = await usuarios.GetByIdentityUserIdAsync(
            identityUserId, cancellationToken);

        if (usuario is null)
        {
            return Fallo(
                MotivoDeRechazo.NoEncontrado,
                "No se encontró el usuario.");
        }

        if (!usuario.is_active)
        {
            return Fallo(
                MotivoDeRechazo.UsuarioDesactivado,
                "Tu usuario está desactivado. No podés ingresar dinero.");
        }

        var catalogo = await tipos.GetAllAsync(cancellationToken);

        var tipoDeposito = catalogo.SingleOrDefault(tipo =>
            string.Equals(
                tipo.Descripcion,
                "DEPOSITO",
                StringComparison.OrdinalIgnoreCase));

        if (tipoDeposito is null)
        {
            return Fallo(
                MotivoDeRechazo.TipoMovimientoNoConfigurado,
                "No está configurado el tipo de movimiento DEPOSITO.");
        }

        await using var transaccion =
            await db.Database.BeginTransactionAsync(cancellationToken);

        var cuenta = await cuentas.GetByUsuarioIdAsync(
            usuario.id, cancellationToken);

        if (cuenta is null)
        {
            return Fallo(
                MotivoDeRechazo.CuentaNoEncontrada,
                "No tenés una cuenta asociada.");
        }

        if (cuenta.saldo > LimitesDeImporte.SaldoMaximo - importe)
        {
            return Fallo(
                MotivoDeRechazo.SaldoMaximoSuperado,
                "El depósito supera el saldo máximo permitido.");
        }

        var actualizado = await cuentas.IncrementarSaldoAsync(
            usuario.id, importe, cancellationToken);

        if (!actualizado)
        {
            return Fallo(
                MotivoDeRechazo.NoSePudoActualizar,
                "No se pudo acreditar el depósito. Revisá el estado de tu cuenta y su saldo.");
        }

        var movimiento = new Movimiento
        {
            cuenta_id = cuenta.id,
            tipo_movimiento_id = tipoDeposito.Id,
            importe = importe,
            fecha = DateTime.UtcNow,
            transferencia_id = null
        };

        await movimientos.AddAsync(movimiento, cancellationToken);

        // Leemos el saldo de la base después de incrementarlo.
        var cuentaActualizada = await cuentas.GetByUsuarioIdAsync(
            usuario.id, cancellationToken);

        if (cuentaActualizada is null)
        {
            throw new InvalidOperationException(
                "No se encontró la cuenta después de acreditar el depósito.");
        }

        var respuesta = new DepositoResponse(
            Message: "Depósito realizado exitosamente.",
            MovimientoId: movimiento.id,
            Importe: movimiento.importe,
            SaldoActual: cuentaActualizada.saldo,
            Fecha: movimiento.fecha);

        await transaccion.CommitAsync(cancellationToken);

        return Resultado<DepositoResponse>.Exito(respuesta);
    }

    private static Resultado<DepositoResponse> Fallo(
        MotivoDeRechazo motivo,
        string mensaje)
    {
        return Resultado<DepositoResponse>.Fallo(motivo, mensaje);
    }
}