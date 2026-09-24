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
            // La contraparte: una transferencia se guarda como dos movimientos (el débito de
            // quien envía y el crédito de quien recibe) que comparten transferencia_id. Es el
            // titular de la cuenta del OTRO movimiento con ese mismo transferencia_id.
            //
            // La subconsulta va escrita acá adentro y no en un método aparte a propósito: así
            // EF la traduce a SQL y sale todo en UNA consulta. En un método, EF la correría
            // fila por fila mientras todavía está leyendo la página.
            //
            // "transferencia_id != null" no es redundante: EF compara con la semántica de C#,
            // donde null == null da verdadero. Sin esa condición, un depósito (que no tiene
            // transferencia_id) encontraría como "contraparte" a cualquier otro depósito.
            .Select(movimiento => new MovimientoLeido(
                movimiento.id,
                movimiento.fecha,
                movimiento.tipo_movimiento.descripcion,
                movimiento.importe,
                context.Movimientos
                    .Where(otro => movimiento.transferencia_id != null
                        && otro.transferencia_id == movimiento.transferencia_id
                        && otro.id != movimiento.id)
                    .Select(otro => new ContraparteLeida(
                        otro.cuenta.usuario.nombre,
                        otro.cuenta.usuario.apellido))
                    .FirstOrDefault()))
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