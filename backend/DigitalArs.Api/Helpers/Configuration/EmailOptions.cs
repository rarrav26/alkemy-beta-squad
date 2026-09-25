using System.ComponentModel.DataAnnotations;
namespace DigitalArs.Api.Helpers.Configuration;

// Sección "Email" de la configuración: a qué servidor SMTP se entregan los correos y hacia
// dónde apuntan los enlaces que llevan. Los valores por defecto son los de smtp4dev, el SMTP de
// desarrollo que atrapa los correos sin mandarlos a Internet (ver el README de la raíz). En
// producción se cambia esta sección por la de un proveedor real sin tocar el código.
public class EmailOptions
{
    [Required] public string Host { get; set; } = "localhost";
    [Range(1, 65535)] public int Port { get; set; } = 2525;
    public bool EnableSsl { get; set; }

    // smtp4dev no pide credenciales. Un proveedor real sí: van en user-secrets, nunca en Git.
    public string? User { get; set; }
    public string? Password { get; set; }

    [Required, EmailAddress] public string From { get; set; } = "no-responder@digitalars.com";
    [Required] public string FromName { get; set; } = "DigitalArs";

    // El enlace de la invitación abre una pantalla del frontend, no un endpoint de la API.
    [Required, Url] public string FrontendBaseUrl { get; set; } = "http://localhost:5173";
}
