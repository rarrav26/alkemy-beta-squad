namespace DigitalArs.Api.DTOs;

// El alta administrativa no crea contraseña: devuelve la invitación para que el administrador
// se la entregue a la persona, que la canjea en /api/auth/initial-password.
public record UsuarioCreadoResponse(
    int UsuarioId, string? Email, bool RequiresPasswordSetup, string InvitationToken, int ExpiresInSeconds);
