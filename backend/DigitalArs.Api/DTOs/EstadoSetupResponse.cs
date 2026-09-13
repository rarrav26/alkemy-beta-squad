namespace DigitalArs.Api.DTOs;

// Le dice al frontend si la instalación ya tiene administrador. SetupEnabled y RequiresSetupKey
// quedaron en false fijo: el alta del administrador se hace por CLI, no por HTTP.
public record EstadoSetupResponse(bool RequiresSetup, bool SetupEnabled, bool RequiresSetupKey);
