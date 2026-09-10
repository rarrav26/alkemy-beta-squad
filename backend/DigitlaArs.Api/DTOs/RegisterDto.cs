namespace DigitlaArs.Api.DTOs;

public class RegisterDto
{
    public required string Nombre { get; set; }
    public required string Apellido { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
}