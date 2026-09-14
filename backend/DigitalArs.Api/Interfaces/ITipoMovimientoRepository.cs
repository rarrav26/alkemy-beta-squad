using DigitalArs.Api.DTOs;

namespace DigitalArs.Api.Interfaces;

// Es un catálogo de solo lectura y sin reglas propias, así que el repositorio ya devuelve la
// respuesta armada: la consulta trae solo las dos columnas que se publican y el controller
// no necesita conocer la entidad. Mismo criterio que ITokenService, que devuelve SesionResponse.
public interface ITipoMovimientoRepository
{
    Task<List<TipoMovimientoResponse>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<TipoMovimientoResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<TipoMovimientoResponse?> GetByDescripcionAsync(string descripcion, CancellationToken cancellationToken = default);
}
