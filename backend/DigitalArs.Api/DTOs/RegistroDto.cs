using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

// El autorregistro agrega la contraseña que elige la propia persona. El alta administrativa
// usa PerfilUsuarioDto sin contraseña, porque se define después con la invitación.
public class RegistroDto : PerfilUsuarioDto
{
    [Required, StringLength(128, MinimumLength = 8)]
    public required string Password { get; set; }
}
