using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Results;

namespace DigitalArs.Api.Interfaces;

// Las notificaciones que el usuario consulta y gestiona desde la campana.
//
// Todos los métodos reciben identityUserId (el usuario del token) y nunca un id de usuario que
// venga de la URL o del cuerpo: así nadie puede leer ni tocar las notificaciones de otro.
public interface INotificacionService
{
    Task<Resultado<NotificacionesResponse>> ListarAsync(
        string identityUserId,
        CancellationToken cancellationToken = default);

    // Las dos operaciones de marcado no devuelven nada cuando salen bien, así que informan solo
    // el motivo del rechazo y null significa éxito. Es el mismo contrato que usa
    // IAccountService.CambiarEstadoAsync para sus operaciones sin cuerpo.
    Task<MotivoDeRechazo?> MarcarLeidaAsync(
        string identityUserId,
        int id,
        CancellationToken cancellationToken = default);

    Task<MotivoDeRechazo?> MarcarTodasLeidasAsync(
        string identityUserId,
        CancellationToken cancellationToken = default);
}
