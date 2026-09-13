namespace DigitalArs.Api.Services;

// El motivo por el que un servicio rechazó una operación. Es un motivo de negocio, no de HTTP:
// el servicio dice qué pasó y cada controller decide con qué status y con qué texto responder.
public enum MotivoDeRechazo
{
    CredencialesInvalidas,
    UsuarioDesactivado,
    FaltaDefinirPassword,
    InvitacionInvalida,
    DatosInvalidos,
    NoEncontrado,
    NoPuedeRecibirInvitacion,
    NoSePudoActualizar
}
