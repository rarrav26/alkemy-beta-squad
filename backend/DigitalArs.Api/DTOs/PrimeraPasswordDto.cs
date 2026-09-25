using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

// Lo que manda quien recibió por correo la invitación para definir su primera contraseña.
public class PrimeraPasswordDto
{
    /// <example>ana@ejemplo.com</example>
    [Required, EmailAddress]
    public string Email { get; set; } = "";

    /// <summary>El token que llega en el enlace del correo de invitación (parámetro token).</summary>
    /// <example>INVITACION_RECIBIDA</example>
    [Required]
    public string InvitationToken { get; set; } = "";

    /// <example>MiNuevaPassword123!</example>
    [Required, StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = "";

    /// <example>MiNuevaPassword123!</example>
    [Required, Compare(nameof(Password))]
    public string ConfirmPassword { get; set; } = "";
}
