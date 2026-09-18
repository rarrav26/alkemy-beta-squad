namespace DigitalArs.Api.Helpers.Configuration;

// Datos de la invitación con la que un usuario creado por el administrador define su primera
// contraseña. Están acá y no en cada servicio porque los usan tanto quien genera el token
// como quien lo verifica, y tienen que coincidir.
public static class Invitacion
{
    // Identifica para qué se emitió el token: uno generado con otro propósito no sirve acá.
    public const string Proposito = "DigitalArs.InitialPassword.v1";

    // Es el plazo que se le informa al frontend, así que tiene que seguir al TokenLifespan de
    // DataProtectionTokenProviderOptions que configura Program.cs.
    public const int ExpiraEnSegundos = 86400;
}
