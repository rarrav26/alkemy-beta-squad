namespace DigitalArs.Api.DTOs;

public record InvitacionResponse(
    string? Email, bool RequiresPasswordSetup, string InvitationToken, int ExpiresInSeconds);
