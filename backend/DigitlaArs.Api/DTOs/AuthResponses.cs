namespace DigitalArs.Api.DTOs;

public record RegistroResponse(string Message, string? Email, string Alias, string Cvu, decimal Saldo);

public record PerfilResponse(int UsuarioId, string Nombre, string Apellido, string Email, string Role);

public record MensajeResponse(string Message);
