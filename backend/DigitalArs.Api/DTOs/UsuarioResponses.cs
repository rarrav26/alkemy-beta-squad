namespace DigitalArs.Api.DTOs;

public record UsuarioCreadoResponse(
    int UsuarioId, string? Email, bool RequiresPasswordSetup, string InvitationToken, int ExpiresInSeconds);

public record InvitacionResponse(
    string? Email, bool RequiresPasswordSetup, string InvitationToken, int ExpiresInSeconds);
