using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

// El autorregistro agrega la contraseña que elige la propia persona. El alta administrativa
// usa PerfilUsuarioDto sin contraseña, porque se define después con la invitación.
public class RegistroDto : PerfilUsuarioDto
{
    /// <summary>Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.</summary>
    /// <example>EjemploSeguro123!</example>
    [Required, StringLength(128, MinimumLength = 8)]
    public required string Password { get; set; }
}
