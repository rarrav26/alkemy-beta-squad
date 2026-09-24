using System.Net;
using System.Net.Mail;
using DigitalArs.Api.Helpers.Configuration;
using DigitalArs.Api.Helpers.Domain;
using DigitalArs.Api.Interfaces;
using Microsoft.Extensions.Options;

namespace DigitalArs.Api.Services;

// Entrega la invitación por SMTP con el SmtpClient que trae .NET, sin paquetes extra. A qué
// servidor se conecta lo decide la sección "Email" de la configuración.
public class SmtpEnviadorDeInvitaciones(
    IOptions<EmailOptions> opciones,
    ILogger<SmtpEnviadorDeInvitaciones> logger) : IEnviadorDeInvitaciones
{
    public async Task<bool> EnviarAsync(
        string email, string nombre, string invitationToken, CancellationToken cancellationToken = default)
    {
        var config = opciones.Value;
        var enlace = CorreoDeInvitacion.Enlace(config.FrontendBaseUrl, email, invitationToken);

        using var mensaje = new MailMessage
        {
            From = new MailAddress(config.From, config.FromName),
            Subject = CorreoDeInvitacion.Asunto,
            Body = CorreoDeInvitacion.Cuerpo(nombre, enlace, Invitacion.ExpiraEnSegundos / 3600),
            IsBodyHtml = true
        };
        mensaje.To.Add(email);

        using var cliente = new SmtpClient(config.Host, config.Port) { EnableSsl = config.EnableSsl };
        if (!string.IsNullOrEmpty(config.User))
            cliente.Credentials = new NetworkCredential(config.User, config.Password);

        try
        {
            await cliente.SendMailAsync(mensaje, cancellationToken);
            return true;
        }
        catch (Exception ex) when (ex is SmtpException or InvalidOperationException)
        {
            // Se registra el destinatario pero nunca el token ni el enlace: el log no puede
            // convertirse en otra forma de conseguir la invitación.
            logger.LogError(ex, "No se pudo enviar la invitación a {Email} por {Host}:{Port}.",
                email, config.Host, config.Port);
            return false;
        }
    }
}
