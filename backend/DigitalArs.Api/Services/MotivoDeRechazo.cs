namespace DigitalArs.Api.Services;

// El servicio indica qué ocurrió.
// El controller decide el código HTTP y el mensaje de respuesta.
public enum MotivoDeRechazo
{
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
    TipoMovimientoNoConfigurado,
    DestinoNoEncontrado
}