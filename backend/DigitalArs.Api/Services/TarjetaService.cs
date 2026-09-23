using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
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
    IMemoryCache intentos) : ITarjetaService
{
    // Mismo patrón que AccountService.IntentosParaGenerarAlias: el número se sortea al azar,
    // así que puede chocar con uno ya emitido y hay que volver a intentar.
    private const int IntentosParaGenerarNumero = 10;

    // Intentos de contraseña antes de bloquear el revelado.
    private const int IntentosDePasswordPermitidos = 3;

    // Cuánto dura el bloqueo. Se cuenta desde el último intento fallido.
    private static readonly TimeSpan DuracionDelBloqueo = TimeSpan.FromMinutes(15);

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

        return Resultado<TarjetaResponse>.Exito(Presentar(tarjeta, perfil));
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

    // El perfil y la cuenta que toda operación necesita. Es un record para poder viajar dentro
    // de un Resultado<T>, que exige que T sea una clase.
    private sealed record ContextoDeTarjeta(Usuario Perfil, Cuenta Cuenta);
}
