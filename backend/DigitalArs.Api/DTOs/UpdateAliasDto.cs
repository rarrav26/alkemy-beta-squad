using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

public class UpdateAliasDto
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    [RegularExpression("^[A-Za-z]+$", ErrorMessage = "El alias solo puede contener letras.")]
    public string Alias { get; set; } = null!;
}
