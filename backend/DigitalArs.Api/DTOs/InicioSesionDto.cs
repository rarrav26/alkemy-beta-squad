using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

public class InicioSesionDto
{
    /// <example>ana@ejemplo.com</example>
    [Required, EmailAddress, StringLength(256)]
    public required string Email { get; set; }

    /// <example>EjemploSeguro123!</example>
    [Required, StringLength(128)]
    public required string Password { get; set; }
}
