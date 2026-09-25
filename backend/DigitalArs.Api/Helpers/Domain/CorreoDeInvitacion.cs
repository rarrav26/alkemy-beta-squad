using System.Net;

namespace DigitalArs.Api.Helpers.Domain;

// El correo con el que un usuario creado por el administrador define su primera contraseña.
//
// Es una regla pura, como MensajesDeNotificacion: no depende del SMTP ni de la base, así que se
// puede probar sola. Quien la usa es el enviador de invitaciones.
public static class CorreoDeInvitacion
{
    public const string Asunto = "Creá tu contraseña de DigitalArs";

    // El token de Identity trae caracteres como +, / e =, que en una URL cambian de significado:
    // sin escaparlos, el enlace llega roto y la pantalla responde "Invitación inválida".
    public static string Enlace(string frontendBaseUrl, string email, string invitationToken) =>
        $"{frontendBaseUrl.TrimEnd('/')}/primera-password" +
        $"?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(invitationToken)}";

    public static string Cuerpo(string nombre, string enlace, int horasDeValidez)
    {
        // El nombre lo cargó el administrador: se escapa para que no pueda inyectar HTML.
        var nombreSeguro = WebUtility.HtmlEncode(nombre);
        var enlaceSeguro = WebUtility.HtmlEncode(enlace);
        return $"""
            <p>Hola {nombreSeguro}:</p>
            <p>Un administrador te creó una cuenta en DigitalArs. Para empezar a usarla, elegí tu contraseña desde este enlace:</p>
            <p><a href="{enlaceSeguro}">Crear mi contraseña</a></p>
            <p>El enlace vence en {horasDeValidez} horas y sirve una sola vez. Si no esperabas este correo, ignoralo.</p>
            """;
    }
}
