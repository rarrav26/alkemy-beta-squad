namespace DigitalArs.Api.DTOs;

// El alta administrativa no crea contraseña: le manda a la persona un correo con el enlace para
// elegirla en /api/auth/initial-password. El token no viaja en esta respuesta, así que el
// administrador nunca lo conoce. InvitationSent en false indica que el correo no salió: el
// usuario quedó creado igual y la invitación se puede reenviar.
public record UsuarioCreadoResponse(
    int UsuarioId, string? Email, bool RequiresPasswordSetup, bool InvitationSent, int ExpiresInSeconds);
