using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.Interfaces;

namespace DigitalArs.Api.Repositories;

public class MovimientoRepository(DigitalArsDbContext context)
    : IMovimientoRepository
{
    public async Task AddAsync(
        Movimiento movimiento,
        CancellationToken cancellationToken = default)
    {
        await context.Movimientos.AddAsync(
            movimiento,
            cancellationToken);

        await context.SaveChangesAsync(cancellationToken);
    }
}