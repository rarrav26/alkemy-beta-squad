using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

public class UpdateProfileDto
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

    // La contraseña actual es requerida solo si se intenta cambiar el email.
    [StringLength(100)]
    public string? CurrentPassword { get; set; }
}
