using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Domain;
using DigitalArs.Api.Helpers.Results;
using DigitalArs.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Services;

public class TransferenciaService(
    ICuentaRepository cuentas,
    IUsuarioRepository usuarios,
    ITipoMovimientoRepository tiposMovimiento,
    INotificacionRepository notificaciones,
    INotificadorEnTiempoReal notificador,
    DigitalArsDbContext context) : ITransferenciaService
{
    // El formato del nombre vive en NombreDelTitular: lo comparte con el historial.
    private static string NombreCompletoDe(Usuario usuario) =>
        NombreDelTitular.Completo(usuario.nombre, usuario.apellido);


    public async Task<Resultado<DestinoResponseDto>> ResolverDestinoAsync(
        string identityUserId,
        TransferenciaDto dto,
        CancellationToken cancellationToken = default)
    {
        // Se normaliza igual que al guardar un alias: los alias se almacenan en minúsculas, y la
        // búsqueda por alias o CVU compara texto exacto, así que sin esto escribir
        // "MariaGonzalez" no encontraría la cuenta y el usuario leería "no existe".
        var destino = DatosDeCuenta.NormalizarAlias(dto.Destino);

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

        if (!usuarioOrigen.is_active)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.UsuarioDesactivado,
                "Tu usuario se encuentra desactivado.");
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
            Cvu: cuentaDestino.cvu,
            Titular: NombreCompletoDe(cuentaDestino.usuario!));

        return Resultado<DestinoResponseDto>.Exito(respuesta);
    }

    public async Task<Resultado<TransferenciaResponseDto>> TransferirAsync(
        string identityUserId,
        TransferenciaDto dto,
        CancellationToken cancellationToken = default)
    {
        // Se normaliza igual que al guardar un alias: los alias se almacenan en minúsculas, y la
        // búsqueda por alias o CVU compara texto exacto, así que sin esto escribir
        // "MariaGonzalez" no encontraría la cuenta y el usuario leería "no existe".
        var destino = DatosDeCuenta.NormalizarAlias(dto.Destino);

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

        // 1. Lecturas por repositorio
        var cuentaOrigen = await cuentas.GetByUsuarioIdAsync(usuarioOrigen.id, cancellationToken);
        if (cuentaOrigen is null)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.CuentaNoEncontrada, "No tenés una cuenta asociada.");

        var cuentaDestino = await cuentas.GetByAliasOCvuAsync(destino, cancellationToken);
        if (cuentaDestino is null)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.DestinoNoEncontrado, "No se encontró ninguna cuenta con ese alias o CVU.");

        if (cuentaDestino.id == cuentaOrigen.id)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.MismaCuenta, "No podés transferir dinero a tu propia cuenta.");

        if (cuentaDestino.usuario is null || !cuentaDestino.usuario.is_active)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.UsuarioDesactivado, "La cuenta destino no pertenece a un usuario activo.");

        // 2. Validación de saldo en origen antes de entrar a base
        if (cuentaOrigen.saldo < importe)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.SaldoInsuficiente, "Saldo insuficiente para realizar la transferencia.");

        // 3. Tope de saldo en destino
        if (cuentaDestino.saldo + importe > LimitesDeImporte.SaldoMaximo)
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.SaldoMaximoSuperado, "La cuenta destino superaría el saldo máximo permitido.");

        // 4. Transacción explícita obligatoria
        await using var transaccion = await context.Database.BeginTransactionAsync(cancellationToken);

        // 5. Débito con guarda atómica en SQL
        var debitoOk = await cuentas.DecrementarSaldoAsync(usuarioOrigen.id, importe, cancellationToken);
        if (!debitoOk)
        {
            await transaccion.RollbackAsync(cancellationToken);
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.SaldoInsuficiente, "Saldo insuficiente para realizar la transferencia.");
        }

        // 6. Crédito con guarda en destino
        var creditoOk = await cuentas.IncrementarSaldoAsync(cuentaDestino.usuario_id, importe, cancellationToken);
        if (!creditoOk)
        {
            await transaccion.RollbackAsync(cancellationToken);
            return Resultado<TransferenciaResponseDto>.Fallo(MotivoDeRechazo.NoSePudoActualizar, "No se pudo acreditar el dinero en la cuenta destino.");
        }

        // 7. Resolver tipos de movimiento dinámicamente (sin IDs fijos)
        var tipoDebito = await tiposMovimiento.GetByDescripcionAsync(SignoDeMovimiento.TipoTransferenciaEnviada, cancellationToken);
        var tipoCredito = await tiposMovimiento.GetByDescripcionAsync(SignoDeMovimiento.TipoTransferenciaRecibida, cancellationToken);

        if (tipoDebito is null || tipoCredito is null)
        {
            await transaccion.RollbackAsync(cancellationToken);
            return Resultado<TransferenciaResponseDto>.Fallo(
                MotivoDeRechazo.TipoMovimientoNoConfigurado,
                "Los tipos de movimiento requeridos no están configurados en el sistema.");
        }

        var fechaOperacion = DateTime.UtcNow;

        var movDebito = new Movimiento
        {
            cuenta_id = cuentaOrigen.id,
            tipo_movimiento_id = tipoDebito.Id,
            importe = importe,
            fecha = fechaOperacion
        };

        var movCredito = new Movimiento
        {
            cuenta_id = cuentaDestino.id,
            tipo_movimiento_id = tipoCredito.Id,
            importe = importe,
            fecha = fechaOperacion
        };

        context.Movimientos.Add(movDebito);
        context.Movimientos.Add(movCredito);
        await context.SaveChangesAsync(cancellationToken);

        // 8. Enlazar transferencia_id sin if redundante
        movDebito.transferencia_id = movDebito.id;
        movCredito.transferencia_id = movDebito.id;
        await context.SaveChangesAsync(cancellationToken);

        // 9. Un aviso para cada lado, DENTRO de la misma transacción que los movimientos: una
        // transferencia revertida no puede dejar a nadie avisado de dinero que no se movió.
        // Van acá y no antes porque necesitan el id de cada movimiento, que lo asigna la base
        // en el SaveChangesAsync de arriba. Los dos reusan fechaOperacion, así los movimientos
        // y sus avisos tienen la misma marca temporal.
        var avisoParaQuienEnvia = new Notificacion
        {
            usuario_id = usuarioOrigen.id,
            movimiento_id = movDebito.id,
            titulo = MensajesDeNotificacion.TituloTransferenciaEnviada,
            mensaje = MensajesDeNotificacion.TransferenciaEnviada(
                importe, NombreCompletoDe(cuentaDestino.usuario!)),
            fecha = fechaOperacion
        };

        var avisoParaQuienRecibe = new Notificacion
        {
            usuario_id = cuentaDestino.usuario_id,
            movimiento_id = movCredito.id,
            titulo = MensajesDeNotificacion.TituloTransferenciaRecibida,
            mensaje = MensajesDeNotificacion.TransferenciaRecibida(
                importe, NombreCompletoDe(usuarioOrigen)),
            fecha = fechaOperacion
        };

        await notificaciones.AddAsync(avisoParaQuienEnvia, cancellationToken);
        await notificaciones.AddAsync(avisoParaQuienRecibe, cancellationToken);

        // Confirmar transacción
        await transaccion.CommitAsync(cancellationToken);

        // 10. Avisar a los dos, recién con la transferencia confirmada. Avisar antes del commit
        // significaría que un rollback deja a alguien viendo plata que nunca se movió.
        //
        // No se les pasa el cancellationToken: si quien transfirió cortó la conexión justo
        // después del commit, al que recibe el dinero igual tiene que llegarle el aviso. Y si
        // el envío falla, no rompe nada: el notificador se traga su propia excepción y los dos
        // avisos ya están guardados en la base.
        await notificador.EnviarAsync(identityUserId, avisoParaQuienEnvia);
        await notificador.EnviarAsync(cuentaDestino.usuario!.identity_user_id, avisoParaQuienRecibe);

        // 11. Re-leer saldo actualizado para la respuesta
        var cuentaActualizada = await cuentas.GetByUsuarioIdAsync(usuarioOrigen.id, cancellationToken);

        return Resultado<TransferenciaResponseDto>.Exito(new TransferenciaResponseDto(cuentaActualizada!.saldo));
    }
}