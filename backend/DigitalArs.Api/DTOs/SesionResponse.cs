namespace DigitalArs.Api.DTOs;

// Lo que recibe el frontend cuando una sesión queda abierta, sea por login o por definir la
// primera contraseña. ExpiresAt viaja en UTC.
public record SesionResponse(string Token, string Role, DateTime ExpiresAt, int UsuarioId);
