namespace DigitalArs.Api.DTOs;

// Resultado de reenviar la invitación. Como en el alta, el token solo viaja por correo.
public record InvitacionResponse(
    string? Email, bool RequiresPasswordSetup, bool InvitationSent, int ExpiresInSeconds);
