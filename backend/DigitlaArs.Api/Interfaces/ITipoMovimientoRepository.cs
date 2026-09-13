using DigitalArs.Api.Data.Entities;

namespace DigitalArs.Api.Interfaces;

public interface ITipoMovimientoRepository
{
    Task<List<Tipo_Movimiento>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Tipo_Movimiento?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
}
