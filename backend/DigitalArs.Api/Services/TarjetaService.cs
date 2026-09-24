using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Common;
using DigitalArs.Api.Helpers.Domain;
using DigitalArs.Api.Helpers.Results;
using DigitalArs.Api.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace DigitalArs.Api.Services;

public class TarjetaService(
    DigitalArsDbContext db,
    UserManager<IdentityUser> users,
    IUsuarioRepository usuarios,
    ICuentaRepository cuentas,
    ITipoMovimientoRepository tipos,
    INotificadorEnTiempoReal notificador,
    IMemoryCache intentos) : ITarjetaService
{
    // Mismo patrón que AccountService.IntentosParaGenerarAlias: el número se sortea al azar,
    // así que puede chocar con uno ya emitido y hay que volver a intentar.
    private const int IntentosParaGenerarNumero = 10;

    // Intentos de contraseña antes de bloquear el revelado.
    private const int IntentosDePasswordPermitidos = 3;

    // Cuánto dura el bloqueo. Se cuenta desde el último intento fallido.
    private static readonly TimeSpan DuracionDelBloqueo = TimeSpan.FromMinutes(15);

    // Cuántos eventos de bitácora devuelve el resumen del administrador. Es una lista para
    // mirar, no un export: los contadores del resumen sí cuentan todo.
    private const int EventosDelResumen = 20;

    // =======================================================================================
    // GENERAR
    // =======================================================================================

    public async Task<Resultado<TarjetaResponse>> GenerarAsync(
        string identityUserId,
        CancellationToken cancellationToken = default)
    {
        var contexto = await ResolverContextoAsync(identityUserId, cancellationToken);
        if (!contexto.Exitoso)
            return Resultado<TarjetaResponse>.Fallo(contexto.Motivo!.Value, contexto.Errores);

        var (perfil, cuenta) = contexto.Valor!;

        // Si ya hay una vigente no se genera otra: es el criterio "una única tarjeta activa por
        // cuenta". El índice UQ_Tarjetas_CuentaVigente lo garantiza igual en la base, pero
        // comprobarlo acá permite responder 409 con un mensaje claro en vez de dejar que
        // explote un error de índice único.
        var vigente = await BuscarVigenteAsync(cuenta.id, cancellationToken);
        if (vigente is not null)
            return Resultado<TarjetaResponse>.Fallo(MotivoDeRechazo.TarjetaYaExiste,
                "Ya tenés una tarjeta. Dala de baja antes de generar una nueva.");

        var numero = await BuscarNumeroLibreAsync(cancellationToken);
        if (numero is null)
            return Resultado<TarjetaResponse>.Fallo(MotivoDeRechazo.NoSePudoGenerarTarjeta,
                "No se pudo generar la tarjeta. Intentá de nuevo.");

        var tarjeta = new Tarjeta
        {
            cuenta_id = cuenta.id,
            numero = numero,
            vencimiento = DatosDeTarjeta.SortearVencimiento(),
            cvv = DatosDeTarjeta.SortearCodigoDeSeguridad(),
            estado = EstadoDeTarjeta.Activa,
            fecha_alta = DateTime.UtcNow,
            fecha_baja = null
        };

        db.Tarjetas.Add(tarjeta);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Dos pedidos simultáneos pueden pasar los dos la comprobación de más arriba y
            // llegar los dos hasta acá; el índice único deja entrar solo a uno. El otro recibe
            // el mismo 409 que si la tarjeta hubiera existido desde el principio, que es la
            // verdad desde el punto de vista del usuario.
            return Resultado<TarjetaResponse>.Fallo(MotivoDeRechazo.TarjetaYaExiste,
                "Ya tenés una tarjeta. Dala de baja antes de generar una nueva.");
        }

        await RegistrarAsync(
            tarjeta,
            perfil,
            identityUserId,
            TipoDeEventoDeTarjeta.Generada,
            MensajesDeNotificacion.TituloTarjetaGenerada,
            MensajesDeNotificacion.TarjetaGenerada(DatosDeTarjeta.UltimosCuatro(tarjeta.numero)),
            cancellationToken);

        return Resultado<TarjetaResponse>.Exito(Presentar(tarjeta, perfil));
    }

    // =======================================================================================
    // CONSULTAR
    // =======================================================================================

    public async Task<Resultado<TarjetaResponse>> ObtenerMiTarjetaAsync(
        string identityUserId,
        CancellationToken cancellationToken = default)
    {
        var contexto = await ResolverContextoAsync(identityUserId, cancellationToken);
        if (!contexto.Exitoso)
            return Resultado<TarjetaResponse>.Fallo(contexto.Motivo!.Value, contexto.Errores);

        var (perfil, cuenta) = contexto.Valor!;

        // Se devuelve la vigente, no la última: una tarjeta dada de baja no se muestra más.
        // El front usa el 404 para mostrar el estado "todavía no tenés tarjeta".
        var tarjeta = await BuscarVigenteAsync(cuenta.id, cancellationToken);
        if (tarjeta is null)
            return Resultado<TarjetaResponse>.Fallo(MotivoDeRechazo.TarjetaNoEncontrada,
                "Todavía no generaste tu tarjeta.");

        return Resultado<TarjetaResponse>.Exito(Presentar(tarjeta, perfil));
    }

    // =======================================================================================
    // REVELAR
    // =======================================================================================

    public async Task<Resultado<TarjetaSecretoResponse>> RevelarAsync(
        string identityUserId,
        string password,
        CancellationToken cancellationToken = default)
    {
        var contexto = await ResolverContextoAsync(identityUserId, cancellationToken);
        if (!contexto.Exitoso)
            return Resultado<TarjetaSecretoResponse>.Fallo(contexto.Motivo!.Value, contexto.Errores);

        var (_, cuenta) = contexto.Valor!;

        // El bloqueo se comprueba ANTES de mirar la contraseña: si no, cada intento seguiría
        // diciendo si acertó o no, y el tope no serviría para frenar nada.
        if (EstaBloqueado(identityUserId))
            return Resultado<TarjetaSecretoResponse>.Fallo(MotivoDeRechazo.DemasiadosIntentos,
                "Demasiados intentos fallidos. Esperá unos minutos antes de volver a intentar.");

        var tarjeta = await BuscarVigenteAsync(cuenta.id, cancellationToken);
        if (tarjeta is null)
            return Resultado<TarjetaSecretoResponse>.Fallo(MotivoDeRechazo.TarjetaNoEncontrada,
                "Todavía no generaste tu tarjeta.");

        // Una tarjeta congelada no revela su código: si el usuario la congeló porque sospecha
        // uso indebido, mostrar el código iría contra el motivo por el que la congeló.
        if (!EstadoDeTarjeta.PuedeRevelarseElCodigo(tarjeta.estado))
            return Resultado<TarjetaSecretoResponse>.Fallo(
                MotivoDeRechazo.EstadoDeTarjetaNoPermiteLaOperacion,
                "Tu tarjeta está congelada. Descongelala para ver el código de seguridad.");

        var usuarioIdentity = await users.FindByIdAsync(identityUserId);
        if (usuarioIdentity is null)
            return Resultado<TarjetaSecretoResponse>.Fallo(MotivoDeRechazo.NoEncontrado,
                "No se encontró el usuario de identidad.");

        // Re-autenticación, mismo mecanismo que usa AccountService para cambiar el email.
        var passwordValido = await users.CheckPasswordAsync(usuarioIdentity, password);
        if (!passwordValido)
        {
            var restantes = RegistrarIntentoFallido(identityUserId);

            // Se le dice cuántos intentos le quedan: no es información útil para un atacante
            // (ya sabe que falló) y para el usuario legítimo que se equivocó tipeando es la
            // diferencia entre entender el bloqueo y que le aparezca de la nada.
            return Resultado<TarjetaSecretoResponse>.Fallo(MotivoDeRechazo.CredencialesInvalidas,
                restantes > 0
                    ? $"Contraseña incorrecta. Te quedan {restantes} intentos."
                    : "Contraseña incorrecta. Esperá unos minutos antes de volver a intentar.");
        }

        // Acertó: se limpia el contador para que tres errores repartidos en el tiempo no
        // terminen bloqueando a alguien que sí sabe su contraseña.
        LimpiarIntentos(identityUserId);

        return Resultado<TarjetaSecretoResponse>.Exito(
            new TarjetaSecretoResponse(tarjeta.numero, tarjeta.cvv));
    }

    // =======================================================================================
    // CONGELAR / DESCONGELAR
    // =======================================================================================

    public async Task<Resultado<TarjetaResponse>> CambiarCongelamientoAsync(
        string identityUserId,
        bool congelada,
        CancellationToken cancellationToken = default)
    {
        var contexto = await ResolverContextoAsync(identityUserId, cancellationToken);
        if (!contexto.Exitoso)
            return Resultado<TarjetaResponse>.Fallo(contexto.Motivo!.Value, contexto.Errores);

        var (perfil, cuenta) = contexto.Valor!;

        var tarjeta = await BuscarVigenteAsync(cuenta.id, cancellationToken);
        if (tarjeta is null)
            return Resultado<TarjetaResponse>.Fallo(MotivoDeRechazo.TarjetaNoEncontrada,
                "Todavía no generaste tu tarjeta.");

        // Idempotente: congelar una tarjeta ya congelada devuelve el estado actual en vez de
        // un error. El usuario pidió que quedara congelada y quedó congelada; fallar acá solo
        // le mostraría un error por un doble clic.
        var estadoDeseado = congelada ? EstadoDeTarjeta.Congelada : EstadoDeTarjeta.Activa;
        if (tarjeta.estado == estadoDeseado)
            return Resultado<TarjetaResponse>.Exito(Presentar(tarjeta, perfil));

        var permitido = congelada
            ? EstadoDeTarjeta.PuedeCongelarse(tarjeta.estado)
            : EstadoDeTarjeta.PuedeDescongelarse(tarjeta.estado);

        // Con la idempotencia resuelta arriba, lo único que puede caer acá es una tarjeta dada
        // de baja. Es el criterio "no puede reactivarse ni descongelarse".
        if (!permitido)
            return Resultado<TarjetaResponse>.Fallo(
                MotivoDeRechazo.EstadoDeTarjetaNoPermiteLaOperacion,
                "La tarjeta está dada de baja. Generá una nueva.");

        tarjeta.estado = estadoDeseado;
        await db.SaveChangesAsync(cancellationToken);

        // El aviso de congelar es el más valioso de los cuatro: si la tarjeta aparece congelada
        // y no fue el usuario, la notificación es la evidencia de que alguien más entró.
        // Y el evento en la bitácora es lo que permite contar cuántas veces la congeló, que el
        // estado actual por sí solo no puede responder.
        await RegistrarAsync(
            tarjeta,
            perfil,
            identityUserId,
            congelada
                ? TipoDeEventoDeTarjeta.Congelada
                : TipoDeEventoDeTarjeta.Descongelada,
            congelada
                ? MensajesDeNotificacion.TituloTarjetaCongelada
                : MensajesDeNotificacion.TituloTarjetaDescongelada,
            congelada
                ? MensajesDeNotificacion.TarjetaCongelada(DatosDeTarjeta.UltimosCuatro(tarjeta.numero))
                : MensajesDeNotificacion.TarjetaDescongelada(DatosDeTarjeta.UltimosCuatro(tarjeta.numero)),
            cancellationToken);

        return Resultado<TarjetaResponse>.Exito(Presentar(tarjeta, perfil));
    }

    // =======================================================================================
    // DAR DE BAJA
    // =======================================================================================

    public async Task<Resultado<TarjetaResponse>> DarDeBajaAsync(
        string identityUserId,
        CancellationToken cancellationToken = default)
    {
        var contexto = await ResolverContextoAsync(identityUserId, cancellationToken);
        if (!contexto.Exitoso)
            return Resultado<TarjetaResponse>.Fallo(contexto.Motivo!.Value, contexto.Errores);

        var (perfil, cuenta) = contexto.Valor!;

        var tarjeta = await BuscarVigenteAsync(cuenta.id, cancellationToken);

        // BuscarVigente ya excluye las dadas de baja, así que una segunda baja llega acá como
        // "no encontrada". No se distingue a propósito: decirle al usuario que su tarjeta
        // "existe pero está dada de baja" no le sirve de nada y expone el historial.
        if (tarjeta is null)
            return Resultado<TarjetaResponse>.Fallo(MotivoDeRechazo.TarjetaNoEncontrada,
                "No tenés una tarjeta para dar de baja.");

        // Se puede dar de baja tanto una activa como una congelada.
        if (!EstadoDeTarjeta.PuedeDarseDeBaja(tarjeta.estado))
            return Resultado<TarjetaResponse>.Fallo(
                MotivoDeRechazo.EstadoDeTarjetaNoPermiteLaOperacion,
                "La tarjeta ya está dada de baja.");

        // Baja LÓGICA: la fila se conserva. Las dos asignaciones van juntas porque el CHECK
        // CK_Tarjetas_Baja exige que el estado y la fecha sean coherentes; cambiar solo una
        // hace fallar el SaveChanges.
        tarjeta.estado = EstadoDeTarjeta.DadaDeBaja;
        tarjeta.fecha_baja = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        await RegistrarAsync(
            tarjeta,
            perfil,
            identityUserId,
            TipoDeEventoDeTarjeta.DadaDeBaja,
            MensajesDeNotificacion.TituloTarjetaDadaDeBaja,
            MensajesDeNotificacion.TarjetaDadaDeBaja(DatosDeTarjeta.UltimosCuatro(tarjeta.numero)),
            cancellationToken);

        return Resultado<TarjetaResponse>.Exito(Presentar(tarjeta, perfil));
    }

    // =======================================================================================
    // PAGAR
    // =======================================================================================

    public async Task<Resultado<PagoConTarjetaResponse>> PagarAsync(
        string identityUserId,
        PagoConTarjetaDto dto,
        CancellationToken cancellationToken = default)
    {
        if (dto.Importe is not decimal importe)
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.DatosInvalidos,
                "El importe es obligatorio.");

        // Misma regla de importe que usan depósito y transferencia: vive en un solo lugar.
        var errorDeImporte = LimitesDeImporte.PrimerErrorDe(importe);
        if (errorDeImporte is not null)
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.DatosInvalidos, errorDeImporte);

        // Se normaliza igual que en TransferenciaService: los alias se guardan en minúsculas, y
        // la búsqueda compara texto exacto. Sin esto, escribir "Kiosco.La.Esquina" no encontraría
        // la cuenta y el usuario leería "no existe" en lugar de un error de formato.
        var destino = DatosDeCuenta.NormalizarAlias(dto.Destino);

        if (!DatosDeCuenta.EsDestinoValido(destino))
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.DatosInvalidos,
                "El destino tiene que ser un alias válido o un CVU de 22 dígitos.");

        var contexto = await ResolverContextoAsync(identityUserId, cancellationToken);
        if (!contexto.Exitoso)
            return Resultado<PagoConTarjetaResponse>.Fallo(contexto.Motivo!.Value, contexto.Errores);

        var (perfil, cuenta) = contexto.Valor!;

        var tarjeta = await BuscarVigenteAsync(cuenta.id, cancellationToken);
        if (tarjeta is null)
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.TarjetaNoEncontrada,
                "Todavía no generaste tu tarjeta.");

        // ACA SE CUMPLE, LITERALMENTE, "tarjeta congelada no permite operaciones asociadas".
        // Se compara contra Activa en vez de reusar PuedeRevelarseElCodigo: hoy las dos reglas
        // coinciden, pero son permisos distintos y atarlos haría que cambiar una cambie la otra
        // sin querer.
        if (tarjeta.estado != EstadoDeTarjeta.Activa)
            return Resultado<PagoConTarjetaResponse>.Fallo(
                MotivoDeRechazo.EstadoDeTarjetaNoPermiteLaOperacion,
                tarjeta.estado == EstadoDeTarjeta.Congelada
                    ? "Tu tarjeta está congelada. Descongelala para poder pagar."
                    : "Tu tarjeta está dada de baja. Generá una nueva para poder pagar.");

        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        if (DatosDeTarjeta.EstaVencida(tarjeta.vencimiento, hoy))
            return Resultado<PagoConTarjetaResponse>.Fallo(
                MotivoDeRechazo.EstadoDeTarjetaNoPermiteLaOperacion,
                "Tu tarjeta está vencida. Dala de baja y generá una nueva.");

        var cuentaDestino = await cuentas.GetByAliasOCvuAsync(destino, cancellationToken);
        if (cuentaDestino is null)
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.DestinoNoEncontrado,
                "No encontramos una cuenta con ese alias o CVU.");

        if (cuentaDestino.id == cuenta.id)
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.MismaCuenta,
                "No podés pagarte a tu propia cuenta.");

        var perfilDestino = await usuarios.GetByIdAsync(cuentaDestino.usuario_id, cancellationToken);
        if (perfilDestino is null)
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.DestinoNoEncontrado,
                "No encontramos el titular de la cuenta destino.");

        // Un destino desactivado no puede cobrar, igual que en una transferencia.
        if (!perfilDestino.is_active)
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.DestinoNoEncontrado,
                "La cuenta destino no está disponible.");

        var tipoPago = await tipos.GetByDescripcionAsync(
            SignoDeMovimiento.TipoPagoConTarjeta, cancellationToken);
        var tipoCobro = await tipos.GetByDescripcionAsync(
            SignoDeMovimiento.TipoPagoRecibido, cancellationToken);

        if (tipoPago is null || tipoCobro is null)
            return Resultado<PagoConTarjetaResponse>.Fallo(
                MotivoDeRechazo.TipoMovimientoNoConfigurado,
                "No están configurados los tipos de movimiento de pago con tarjeta.");

        // Transacción explícita: el débito, el crédito, los dos movimientos y los dos avisos
        // entran o no entran juntos. Acá SI corresponde que los avisos vayan adentro (al
        // contrario que en congelar): avisar de un pago que no se concretó sería peor que no
        // avisar. Mismo criterio que DepositoService y TransferenciaService.
        await using var transaccion = await db.Database.BeginTransactionAsync(cancellationToken);

        if (cuenta.saldo < importe)
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.SaldoInsuficiente,
                "Saldo insuficiente para realizar el pago.");

        if (cuentaDestino.saldo + importe > LimitesDeImporte.SaldoMaximo)
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.SaldoMaximoSuperado,
                "La cuenta destino superaría el saldo máximo permitido.");

        // Guardas atómicas en SQL: la condición va en el WHERE, así dos pagos simultáneos no
        // pueden dejar la cuenta en negativo. Se reusan los mismos métodos del repositorio que
        // usa TransferenciaService, que es donde vive la parte difícil.
        var debitado = await cuentas.DecrementarSaldoAsync(perfil.id, importe, cancellationToken);
        if (!debitado)
        {
            await transaccion.RollbackAsync(cancellationToken);
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.SaldoInsuficiente,
                "Saldo insuficiente para realizar el pago.");
        }

        var acreditado = await cuentas.IncrementarSaldoAsync(
            cuentaDestino.usuario_id, importe, cancellationToken);

        if (!acreditado)
        {
            await transaccion.RollbackAsync(cancellationToken);
            return Resultado<PagoConTarjetaResponse>.Fallo(MotivoDeRechazo.NoSePudoActualizar,
                "No se pudo acreditar el pago en la cuenta destino.");
        }

        var fechaDelPago = DateTime.UtcNow;
        var ultimosCuatro = DatosDeTarjeta.UltimosCuatro(tarjeta.numero);
        var titularOrigen = $"{perfil.nombre} {perfil.apellido}";
        var titularDestino = $"{perfilDestino.nombre} {perfilDestino.apellido}";

        // El movimiento del que paga: lleva la tarjeta, porque salió de ella.
        var movimientoPago = new Movimiento
        {
            cuenta_id = cuenta.id,
            tipo_movimiento_id = tipoPago.Id,
            importe = importe,
            fecha = fechaDelPago,
            transferencia_id = null,
            tarjeta_id = tarjeta.id
        };

        // El movimiento del que cobra: SIN tarjeta_id. La tarjeta es del pagador, y el cobrador
        // no tiene por qué ver en su historial con qué tarjeta le pagaron.
        var movimientoCobro = new Movimiento
        {
            cuenta_id = cuentaDestino.id,
            tipo_movimiento_id = tipoCobro.Id,
            importe = importe,
            fecha = fechaDelPago,
            transferencia_id = null,
            tarjeta_id = null
        };

        db.Movimientos.Add(movimientoPago);
        db.Movimientos.Add(movimientoCobro);
        await db.SaveChangesAsync(cancellationToken);

        var concepto = string.IsNullOrWhiteSpace(dto.Concepto) ? null : dto.Concepto.Trim();

        // Un aviso para cada lado, igual que en una transferencia. El concepto va en los DOS
        // mensajes, y es lo que hace que quede guardado: no hay columna de detalle en
        // Movimientos, así que el texto de la notificación es su lugar de persistencia.
        var avisoPago = new Notificacion
        {
            usuario_id = perfil.id,
            // Un pago SI tiene movimiento, al contrario que los eventos de tarjeta.
            movimiento_id = movimientoPago.id,
            titulo = MensajesDeNotificacion.TituloPagoConTarjeta,
            mensaje = MensajesDeNotificacion.PagoConTarjeta(
                importe, titularDestino, ultimosCuatro, concepto),
            fecha = fechaDelPago
        };

        var avisoCobro = new Notificacion
        {
            usuario_id = perfilDestino.id,
            movimiento_id = movimientoCobro.id,
            titulo = MensajesDeNotificacion.TituloPagoRecibido,
            mensaje = MensajesDeNotificacion.PagoRecibido(importe, titularOrigen, concepto),
            fecha = fechaDelPago
        };

        db.Notificaciones.Add(avisoPago);
        db.Notificaciones.Add(avisoCobro);
        await db.SaveChangesAsync(cancellationToken);

        var cuentaActualizada = await cuentas.GetByUsuarioIdAsync(perfil.id, cancellationToken);
        if (cuentaActualizada is null)
            throw new InvalidOperationException("No se encontró la cuenta después del pago.");

        var respuesta = new PagoConTarjetaResponse(
            Message: "Pago realizado exitosamente.",
            // Se arma con el id del movimiento, que recién existe después del SaveChanges.
            NumeroDeOperacion: DatosDeTarjeta.NumeroDeOperacion(fechaDelPago, movimientoPago.id),
            MovimientoId: movimientoPago.id,
            Importe: importe,
            SaldoActual: cuentaActualizada.saldo,
            UltimosCuatro: ultimosCuatro,
            Titular: titularDestino,
            Destino: destino,
            Concepto: concepto,
            Fecha: HoraDeArgentina.DesdeUtc(fechaDelPago));

        await transaccion.CommitAsync(cancellationToken);

        // Recién con el pago confirmado, y sin cancellationToken: si quien llamó cortó la
        // conexión, los avisos igual tienen que salir. El del cobrador se manda a SU identity,
        // no al del pagador.
        await notificador.EnviarAsync(identityUserId, avisoPago);
        await notificador.EnviarAsync(perfilDestino.identity_user_id, avisoCobro);

        return Resultado<PagoConTarjetaResponse>.Exito(respuesta);
    }

    // =======================================================================================
    // RESUMEN PARA EL ADMINISTRADOR
    // =======================================================================================

    public async Task<Resultado<ResumenDeTarjetasResponse>> ObtenerResumenAsync(
        int usuarioId,
        CancellationToken cancellationToken = default)
    {
        // Se comprueba que el usuario exista para poder devolver 404 en vez de un resumen en
        // cero, que no distinguiría "no hizo nada" de "no existe".
        var perfil = await usuarios.GetByIdAsync(usuarioId, cancellationToken);
        if (perfil is null)
            return Resultado<ResumenDeTarjetasResponse>.Fallo(MotivoDeRechazo.NoEncontrado,
                "No se encontró el usuario.");

        var cuenta = await cuentas.GetByUsuarioIdAsync(usuarioId, cancellationToken);

        // El admin no tiene cuenta, así que tampoco tarjetas. Se devuelve un resumen vacío en
        // lugar de un error: preguntar por la actividad de tarjetas de alguien sin billetera es
        // una pregunta válida y la respuesta honesta es "ninguna".
        if (cuenta is null)
            return Resultado<ResumenDeTarjetasResponse>.Exito(new ResumenDeTarjetasResponse(
                UsuarioId: usuarioId,
                TarjetasGeneradas: 0,
                VecesQueCongelo: 0,
                VecesQueDescongelo: 0,
                TarjetasDadasDeBaja: 0,
                TieneTarjetaVigente: false,
                EstadoActual: null,
                PagosRealizados: 0,
                TotalPagado: 0m,
                Eventos: []));

        // Los ids de TODAS las tarjetas que tuvo, incluidas las dadas de baja: el historial es
        // justamente lo que se quiere auditar.
        var tarjetasDelUsuario = await db.Tarjetas
            .AsNoTracking()
            .Where(t => t.cuenta_id == cuenta.id)
            .Select(t => t.id)
            .ToListAsync(cancellationToken);

        // Un solo GROUP BY en la base en lugar de cuatro COUNT separados: es una consulta contra
        // el índice IX_TarjetaEventos_Tarjeta_Fecha y trae a lo sumo cuatro filas.
        var conteos = await db.TarjetaEventos
            .AsNoTracking()
            .Where(e => tarjetasDelUsuario.Contains(e.tarjeta_id))
            .GroupBy(e => e.tipo)
            .Select(grupo => new { Tipo = grupo.Key, Cantidad = grupo.Count() })
            .ToDictionaryAsync(x => x.Tipo, x => x.Cantidad, cancellationToken);

        var vigente = await BuscarVigenteAsync(cuenta.id, cancellationToken);

        var pagos = await db.Movimientos
            .AsNoTracking()
            .Where(m => m.tarjeta_id != null && tarjetasDelUsuario.Contains(m.tarjeta_id.Value))
            .ToListAsync(cancellationToken);

        // La bitácora en orden cronológico inverso. El desempate por id importa: cuatro eventos
        // de la misma operación pueden compartir el milisegundo, y sin él el orden entre ellos lo
        // decide SQL Server y puede cambiar entre consultas. Mismo criterio que usó el equipo en
        // NotificacionRepository.
        //
        // Se traen los últimos EventosDelResumen y no todos: es una bitácora para mirar, no un
        // export. Los contadores de arriba sí cuentan TODO, así que el resumen no miente aunque
        // la lista esté recortada.
        var eventos = await db.TarjetaEventos
            .AsNoTracking()
            .Where(e => tarjetasDelUsuario.Contains(e.tarjeta_id))
            .OrderByDescending(e => e.fecha)
            .ThenByDescending(e => e.id)
            .Take(EventosDelResumen)
            .Join(db.Tarjetas,
                  evento => evento.tarjeta_id,
                  tarjeta => tarjeta.id,
                  // Solo los últimos cuatro dígitos, igual que en el historial: el número
                  // completo no sale de la base para una consulta de auditoría.
                  (evento, tarjeta) => new { evento.tipo, evento.fecha, Numero = tarjeta.numero })
            .ToListAsync(cancellationToken);

        return Resultado<ResumenDeTarjetasResponse>.Exito(new ResumenDeTarjetasResponse(
            UsuarioId: usuarioId,
            TarjetasGeneradas: conteos.GetValueOrDefault(TipoDeEventoDeTarjeta.Generada),
            VecesQueCongelo: conteos.GetValueOrDefault(TipoDeEventoDeTarjeta.Congelada),
            VecesQueDescongelo: conteos.GetValueOrDefault(TipoDeEventoDeTarjeta.Descongelada),
            TarjetasDadasDeBaja: conteos.GetValueOrDefault(TipoDeEventoDeTarjeta.DadaDeBaja),
            TieneTarjetaVigente: vigente is not null,
            EstadoActual: vigente?.estado,
            PagosRealizados: pagos.Count,
            TotalPagado: pagos.Sum(m => m.importe),
            Eventos: eventos
                .Select(e => new EventoDeTarjetaResponse(
                    Tipo: e.tipo,
                    UltimosCuatro: DatosDeTarjeta.UltimosCuatro(e.Numero),
                    Fecha: HoraDeArgentina.DesdeUtc(e.fecha)))
                .ToList()));
    }

    // =======================================================================================
    // AUXILIARES
    // =======================================================================================

    // Las cinco operaciones arrancan igual: resolver el perfil, comprobar que esté activo y
    // encontrar su cuenta. Está en un método para que las cinco reporten los mismos motivos y
    // no se pueda olvidar una comprobación en una de ellas.
    private async Task<Resultado<ContextoDeTarjeta>> ResolverContextoAsync(
        string identityUserId,
        CancellationToken cancellationToken)
    {
        var perfil = await usuarios.GetByIdentityUserIdAsync(identityUserId, cancellationToken);
        if (perfil is null)
            return Resultado<ContextoDeTarjeta>.Fallo(MotivoDeRechazo.NoEncontrado,
                "No se encontró el perfil del usuario.");

        // Se revalida en el momento de la operación y no solo en el login. Hoy la
        // revalidación por request del token ya corta antes, pero esta guarda no depende de
        // esa configuración: si alguien la cambia, la regla sigue valiendo acá.
        if (!perfil.is_active)
            return Resultado<ContextoDeTarjeta>.Fallo(MotivoDeRechazo.UsuarioDesactivado,
                "Tu usuario está desactivado. Contactá al administrador.");

        var cuenta = await cuentas.GetByUsuarioIdAsync(perfil.id, cancellationToken);

        // El admin no tiene cuenta, así que tampoco puede tener tarjeta. Sin este mensaje el
        // error saldría como una tarjeta inexistente, que es engañoso.
        if (cuenta is null)
            return Resultado<ContextoDeTarjeta>.Fallo(MotivoDeRechazo.CuentaNoEncontrada,
                "Tu usuario no tiene una billetera asociada.");

        return Resultado<ContextoDeTarjeta>.Exito(new ContextoDeTarjeta(perfil, cuenta));
    }

    // La tarjeta que hoy le pertenece al usuario, activa o congelada. Las dadas de baja quedan
    // afuera: existen en la tabla solo como historial.
    //
    // SIN AsNoTracking, al contrario que las consultas de solo lectura del proyecto: congelar
    // y dar de baja modifican la entidad que esto devuelve, y con AsNoTracking el
    // SaveChangesAsync no guardaría nada.
    private Task<Tarjeta?> BuscarVigenteAsync(int cuentaId, CancellationToken cancellationToken) =>
        db.Tarjetas.SingleOrDefaultAsync(
            t => t.cuenta_id == cuentaId
              && (t.estado == EstadoDeTarjeta.Activa || t.estado == EstadoDeTarjeta.Congelada),
            cancellationToken);

    // Sortea números hasta dar con uno que no esté emitido. Devuelve null si se acabaron los
    // intentos. Mismo patrón que AccountService.BuscarAliasLibreAsync.
    private async Task<string?> BuscarNumeroLibreAsync(CancellationToken cancellationToken)
    {
        for (var intento = 0; intento < IntentosParaGenerarNumero; intento++)
        {
            var numero = DatosDeTarjeta.SortearNumero();
            if (!await db.Tarjetas.AnyAsync(t => t.numero == numero, cancellationToken))
                return numero;
        }
        return null;
    }

    private static TarjetaResponse Presentar(Tarjeta tarjeta, Usuario perfil)
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);

        return new TarjetaResponse(
            Id: tarjeta.id,
            UltimosCuatro: DatosDeTarjeta.UltimosCuatro(tarjeta.numero),

            // El titular NO está guardado en la tabla: sale del perfil en cada consulta. Así
            // un cambio de nombre hecho por el admin se refleja solo, sin quedar una copia
            // vieja pegada a la tarjeta. Va en mayúsculas como en una tarjeta real.
            Titular: $"{perfil.nombre} {perfil.apellido}".ToUpperInvariant(),

            Vencimiento: tarjeta.vencimiento.ToString("MM/yy"),
            Estado: tarjeta.estado,
            PuedeCongelarse: EstadoDeTarjeta.PuedeCongelarse(tarjeta.estado),
            PuedeDescongelarse: EstadoDeTarjeta.PuedeDescongelarse(tarjeta.estado),
            PuedeRevelarseElCodigo: EstadoDeTarjeta.PuedeRevelarseElCodigo(tarjeta.estado),
            EstaVencida: DatosDeTarjeta.EstaVencida(tarjeta.vencimiento, hoy));
    }

    // ---------------------------------------------------------------------------------------
    // Contador de intentos de contraseña
    //
    // Va en memoria y no en la base porque es un dato efímero: se reinicia solo con el tiempo
    // y no hay nada que consultar después. Tiene dos límites conocidos, aceptables para este
    // proyecto pero que conviene tener presentes: se pierde si se reinicia la API, y con
    // varias instancias cada una llevaría su propia cuenta.
    //
    // Deliberadamente NO se usa el lockout de Identity, que ya está configurado en 5 intentos:
    // ese contador bloquea el LOGIN, así que un error al mirar el código de seguridad dejaría
    // al usuario sin poder entrar a la aplicación. Son dos cosas distintas y conviene que
    // tengan contadores distintos.
    // ---------------------------------------------------------------------------------------

    private static string ClaveDeIntentos(string identityUserId) =>
        "intentos-revelar-tarjeta:" + identityUserId;

    private bool EstaBloqueado(string identityUserId) =>
        intentos.TryGetValue(ClaveDeIntentos(identityUserId), out int fallidos)
        && fallidos >= IntentosDePasswordPermitidos;

    // Devuelve cuántos intentos quedan.
    private int RegistrarIntentoFallido(string identityUserId)
    {
        var clave = ClaveDeIntentos(identityUserId);
        intentos.TryGetValue(clave, out int fallidos);
        fallidos++;

        // La ventana se reinicia con cada fallo, así que el bloqueo se cuenta desde el último
        // intento y no desde el primero.
        intentos.Set(clave, fallidos, DuracionDelBloqueo);

        return Math.Max(0, IntentosDePasswordPermitidos - fallidos);
    }

    private void LimpiarIntentos(string identityUserId) =>
        intentos.Remove(ClaveDeIntentos(identityUserId));

    // ---------------------------------------------------------------------------------------
    // Bitácora y avisos
    //
    // Un solo método registra LAS DOS cosas: el evento en TarjetaEventos (que es auditoría, y
    // queda para siempre) y la notificación al usuario. Están juntos a propósito: son las dos
    // caras del mismo hecho, y si fueran dos llamadas separadas alguna operación terminaría
    // haciendo una y olvidando la otra.
    //
    // Se llama SIEMPRE DESPUÉS de que el cambio en la tarjeta ya se guardó.
    //
    // DIFERENCIA DELIBERADA CON DepositoService y con PagarAsync: en esos dos el aviso va DENTRO
    // de la transacción, porque avisar de plata que no se movió sería peor que no avisar. Acá es
    // al revés: lo importante es el estado de la tarjeta. Si el usuario congeló su tarjeta
    // porque sospecha uso indebido, ese congelamiento TIENE que quedar aunque falle el registro;
    // revertirlo dejaría operativa una tarjeta que el usuario quiso bloquear.
    //
    // Por eso todo está envuelto en un try: un fallo acá no puede hacer fracasar la operación.
    // Es el mismo criterio que ya documenta INotificadorEnTiempoReal para el envío, extendido
    // al guardado.
    //
    // La notificación se guarda con movimiento_id en null: estos eventos no mueven dinero. Ver
    // database/Notificaciones(v.002).sql.
    private async Task RegistrarAsync(
        Tarjeta tarjeta,
        Usuario perfil,
        string identityUserId,
        string tipoDeEvento,
        string titulo,
        string mensaje,
        CancellationToken cancellationToken)
    {
        try
        {
            var ahora = DateTime.UtcNow;

            db.TarjetaEventos.Add(new TarjetaEvento
            {
                tarjeta_id = tarjeta.id,
                tipo = tipoDeEvento,
                fecha = ahora
            });

            var notificacion = new Notificacion
            {
                usuario_id = perfil.id,
                movimiento_id = null,
                titulo = titulo,
                mensaje = mensaje,
                fecha = ahora
            };

            db.Notificaciones.Add(notificacion);

            // Un solo SaveChanges para el evento y el aviso: van juntos o no van.
            await db.SaveChangesAsync(cancellationToken);

            // Sin cancellationToken: si quien llamó cortó la conexión justo después de que el
            // cambio se guardó, el aviso igual tiene que salir. Mismo criterio que DepositoService.
            await notificador.EnviarAsync(identityUserId, notificacion);
        }
        catch (Exception)
        {
            // Se descarta a propósito. La operación sobre la tarjeta ya está guardada y es lo
            // que importa; solo se pierde el rastro y el aviso. Tragarlo acá es lo que impide
            // que un problema en la bitácora rompa una función de seguridad.
        }
    }

    // El perfil y la cuenta que toda operación necesita. Es un record para poder viajar dentro
    // de un Resultado<T>, que exige que T sea una clase.
    private sealed record ContextoDeTarjeta(Usuario Perfil, Cuenta Cuenta);
}
