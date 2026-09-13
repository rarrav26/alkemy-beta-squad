using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Repositories;

// Es un catálogo de solo lectura: siempre se consulta con AsNoTracking().
public class TipoMovimientoRepository(DigitalArsDbContext context) : ITipoMovimientoRepository
{
    public Task<List<Tipo_Movimiento>> GetAllAsync(CancellationToken cancellationToken = default) =>
        context.Tipo_Movimientos.AsNoTracking().ToListAsync(cancellationToken);

    public Task<Tipo_Movimiento?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        context.Tipo_Movimientos.AsNoTracking()
            .SingleOrDefaultAsync(tipoMovimiento => tipoMovimiento.id == id, cancellationToken);
}
