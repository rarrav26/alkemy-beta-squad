using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

// Lo que un administrador puede cambiar de otro usuario: nombre, apellido y email.
// El tipo y número de documento y el saldo quedan deliberadamente afuera, así el criterio
// "no permite modificar documento ni saldo" lo garantiza la forma del DTO y no un chequeo
// que alguien pueda olvidar. Tampoco pide la contraseña del administrador.
public class AdminUpdateUsuarioDto
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Nombre { get; set; } = null!;

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Apellido { get; set; } = null!;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = null!;
}
