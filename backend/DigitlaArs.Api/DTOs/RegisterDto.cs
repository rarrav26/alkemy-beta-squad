namespace DigitlaArs.Api.DTOs;

public class RegisterDto : UserProfileDto
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(128, MinimumLength = 8)]
    public required string Password { get; set; }
}
