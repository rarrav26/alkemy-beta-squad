using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

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

    public async Task<PaginaDeMovimientos> ListarPaginaAsync(
        FiltroDeMovimientos filtro,
        CancellationToken cancellationToken = default)
    {
        var consulta = AplicarFiltros(
            context.Movimientos.AsNoTracking(),
            filtro);

        var totalItems = await consulta.CountAsync(cancellationToken);

        var aSaltear = (long)(filtro.Page - 1) * filtro.PageSize;

        if (aSaltear >= totalItems)
            return new PaginaDeMovimientos([], totalItems);

        var items = await consulta
            .OrderByDescending(movimiento => movimiento.fecha)
            .ThenByDescending(movimiento => movimiento.id)
            .Skip((int)aSaltear)
            .Take(filtro.PageSize)
            .Select(movimiento => new MovimientoLeido(
                movimiento.id,
                movimiento.fecha,
                movimiento.tipo_movimiento.descripcion,
                movimiento.importe))
            .ToListAsync(cancellationToken);

        return new PaginaDeMovimientos(items, totalItems);
    }

    private static IQueryable<Movimiento> AplicarFiltros(
        IQueryable<Movimiento> movimientos,
        FiltroDeMovimientos filtro)
    {
        var consulta = movimientos
            .Where(movimiento => movimiento.cuenta_id == filtro.CuentaId);

        if (filtro.DesdeUtc is DateTime desde)
        {
            consulta = consulta.Where(movimiento => movimiento.fecha >= desde);
        }

        if (filtro.HastaUtc is DateTime hasta)
        {
            consulta = consulta.Where(movimiento => movimiento.fecha < hasta);
        }

        if (filtro.TiposIncluidos.Count > 0)
        {
            consulta = consulta.Where(movimiento =>
                filtro.TiposIncluidos.Contains(movimiento.tipo_movimiento.descripcion));
        }

        // A diferencia del filtro de arriba, acá la lista vacía sí filtra: significa que el
        // texto buscado no coincidió con ningún tipo y no tiene que salir ningún movimiento.
        // El "no filtres" de la búsqueda es null, no la lista vacía.
        if (filtro.TiposDeLaBusqueda is IReadOnlyList<string> tiposBuscados)
        {
            consulta = consulta.Where(movimiento =>
                tiposBuscados.Contains(movimiento.tipo_movimiento.descripcion));
        }

        return consulta;
    }
}