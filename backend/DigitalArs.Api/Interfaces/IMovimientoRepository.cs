using DigitalArs.Api.Data.Entities;

namespace DigitalArs.Api.Interfaces;

public interface IMovimientoRepository
{
    Task AddAsync(
        Movimiento movimiento,
        CancellationToken cancellationToken = default);

    Task<PaginaDeMovimientos> ListarPaginaAsync(
        FiltroDeMovimientos filtro,
        CancellationToken cancellationToken = default);
}