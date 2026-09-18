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
    DestinoNoEncontrado
}