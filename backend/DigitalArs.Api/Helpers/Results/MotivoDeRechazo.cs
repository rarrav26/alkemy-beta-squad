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

    // Valor propio y no NoEncontrado: ese ya significa "no existe el usuario del token" y los
    // controllers lo traducen a 401. Una notificación que no existe tiene que dar 404.
    NotificacionNoEncontrada
}