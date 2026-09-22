using DigitalArs.Api.DTOs;
using DigitalArs.Api.Services;

namespace DigitalArs.Api.Interfaces;

// El ciclo de vida de la cuenta de un usuario: alta, invitación y estado. Devuelve las
// respuestas ya armadas para que ningún controller tenga que conocer las entidades.
public interface IAccountService
{
    Task<Resultado<RegistroResponse>> RegistrarAsync(RegistroDto dto);

    Task<Resultado<UsuarioCreadoResponse>> CrearConInvitacionAsync(PerfilUsuarioDto dto);

    Task<Resultado<InvitacionResponse>> ReemitirInvitacionAsync(
        int usuarioId, CancellationToken cancellationToken = default);

    Task<Resultado<UsuarioResponse>> ObtenerPorIdAsync(
        int usuarioId, CancellationToken cancellationToken = default);

    Task<Resultado<UsuarioResponse>> ObtenerPorIdentityUserIdAsync(
        string identityUserId, CancellationToken cancellationToken = default);

    Task<Resultado<UsuarioResponse>> UpdateProfileAsync(
        string identityUserId, DTOs.UpdateProfileDto dto, CancellationToken cancellationToken = default);

    // La edición que hace un administrador sobre OTRO usuario. Se identifica por el id de
    // negocio y no exige la contraseña de quien edita, a diferencia de UpdateProfileAsync.
    Task<Resultado<UsuarioResponse>> ActualizarComoAdminAsync(
        int usuarioId, DTOs.AdminUpdateUsuarioDto dto, CancellationToken cancellationToken = default);



    Task<Resultado<CuentaResponse>> UpdateAliasAsync(
        string identityUserId, string newAlias, CancellationToken cancellationToken = default);

    // Null cuando el cambio se guardó: el endpoint responde sin cuerpo, así que no hay nada
    // que devolver más que el motivo del rechazo cuando lo hay.
    Task<MotivoDeRechazo?> CambiarEstadoAsync(
        int usuarioId, bool activo, CancellationToken cancellationToken = default);

    Task<bool> ExisteAdministradorAsync();

    // busqueda filtra por nombre, apellido, email o número de documento. Vacío o null trae todo.
    Task<PaginaResponse<UsuarioAdminItemDto>> ObtenerUsuariosPaginadosAsync(
    int page,
    int pageSize,
    string? busqueda = null,
    CancellationToken cancellationToken = default);
}
