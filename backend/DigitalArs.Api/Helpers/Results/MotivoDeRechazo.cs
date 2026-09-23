namespace DigitalArs.Api.Helpers.Results;

// El servicio indica qué ocurrió.
// El controller decide el código HTTP y el mensaje de respuesta.
public enum MotivoDeRechazo
{   
    MismaCuenta,
    CredencialesInvalidas,
    UsuarioDesactivado,
    FaltaDefinirPassword,
    InvitacionInvalida,
    DatosInvalidos,
    NoEncontrado,
    NoPuedeRecibirInvitacion,
    NoSePudoActualizar,
    CuentaNoEncontrada,
    SaldoMaximoSuperado,
    SaldoInsuficiente,
    TipoMovimientoNoConfigurado,
    DestinoNoEncontrado,

    // --- Tarjetas ---
    TarjetaNoEncontrada,
    // Ya hay una tarjeta vigente (activa o congelada): no se puede generar otra.
    TarjetaYaExiste,
    // La operación pedida no corresponde al estado actual de la tarjeta (descongelar una que
    // no está congelada, revelar el código de una congelada, dar de baja una ya dada de baja).
    EstadoDeTarjetaNoPermiteLaOperacion,
    // Se agotaron los intentos de sortear un número libre.
    NoSePudoGenerarTarjeta,
    // Demasiados intentos fallidos de contraseña sobre el revelado del código.
    DemasiadosIntentos
}