namespace DigitalArs.Api.DTOs;

public record UsuarioAdminItemDto(
    int Id,
    string Nombre,
    string Apellido,
    string Email,
    string TipoDocumento,
    string NroDocumento,
    bool IsActive
);