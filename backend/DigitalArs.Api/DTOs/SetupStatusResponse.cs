namespace DigitalArs.Api.DTOs;

public record SetupStatusResponse(bool RequiresSetup, bool SetupEnabled, bool RequiresSetupKey);
