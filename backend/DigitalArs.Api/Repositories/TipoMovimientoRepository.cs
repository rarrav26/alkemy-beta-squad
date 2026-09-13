using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Repositories;

public class TipoMovimientoRepository(DigitalArsDbContext context) : ITipoMovimientoRepository
{
    public Task<List<TipoMovimientoResponse>> GetAllAsync(CancellationToken cancellationToken = default) =>
        Proyectar(context.Tipo_Movimientos).ToListAsync(cancellationToken);

    public Task<TipoMovimientoResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        Proyectar(context.Tipo_Movimientos.Where(tipoMovimiento => tipoMovimiento.id == id))
            .SingleOrDefaultAsync(cancellationToken);

    // El filtro tiene que aplicarse antes de proyectar: sobre el DTO ya armado, EF no sabe a qué
    // columna corresponde cada propiedad y no puede traducir la consulta a SQL.
    private static IQueryable<TipoMovimientoResponse> Proyectar(IQueryable<Tipo_Movimiento> tipos) =>
        tipos.AsNoTracking()
            .Select(tipoMovimiento => new TipoMovimientoResponse(tipoMovimiento.id, tipoMovimiento.descripcion));
}
