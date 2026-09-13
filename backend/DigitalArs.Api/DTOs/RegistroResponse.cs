namespace DigitalArs.Api.DTOs;

// El autorregistro no abre sesión: devuelve los datos de la cuenta en pesos recién creada
// para que la persona los vea, y después tiene que iniciar sesión.
public record RegistroResponse(string Message, string? Email, string Alias, string Cvu, decimal Saldo);
