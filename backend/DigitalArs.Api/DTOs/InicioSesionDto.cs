using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

public class InicioSesionDto
{
    [Required, EmailAddress, StringLength(256)]
    public required string Email { get; set; }

    [Required, StringLength(128)]
    public required string Password { get; set; }
}
