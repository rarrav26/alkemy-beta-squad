using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

public class ValidatePasswordDto
{
    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = null!;
}
