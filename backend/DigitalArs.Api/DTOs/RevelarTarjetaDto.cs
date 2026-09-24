using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

public class RevelarTarjetaDto
{
    /// <summary>La contraseña de la cuenta. Se vuelve a pedir aunque la sesión ya esté abierta.</summary>
    /// <example>Prueba_1</example>
    [Required(ErrorMessage = "Se requiere la contraseña para ver el código de seguridad.")]
    public string Password { get; set; } = null!;
}
