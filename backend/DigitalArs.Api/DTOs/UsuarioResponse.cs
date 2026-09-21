namespace DigitalArs.Api.DTOs;

public record UsuarioResponse(
    int UsuarioId,
    string Nombre,
    string Apellido,
    string TipoDocumento,
    string NroDocumento,
    string Email,
    bool IsActive,
    CuentaResponse? Cuenta
);
