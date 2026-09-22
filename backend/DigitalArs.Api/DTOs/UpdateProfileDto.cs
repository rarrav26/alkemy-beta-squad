using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

public class UpdateProfileDto
{
    /// <example>Ana María</example>
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Nombre { get; set; } = null!;

    /// <example>Perez</example>
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Apellido { get; set; } = null!;

    /// <example>ana@ejemplo.com</example>
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = null!;

    /// <summary>Obligatoria solo si cambia el email; si no, se ignora.</summary>
    /// <example>EjemploSeguro123!</example>
    [StringLength(100)]
    public string? CurrentPassword { get; set; }
}
