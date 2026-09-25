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
            // Las dos subconsultas de abajo van escritas acá adentro y no en métodos aparte a
            // propósito: así EF las traduce a SQL y sale todo en UNA consulta. En un método, EF
            // las correría fila por fila mientras todavía está leyendo la página.
            .Select(movimiento => new MovimientoLeido(
                movimiento.id,
                movimiento.fecha,
                movimiento.tipo_movimiento.descripcion,
                movimiento.importe,
                // Los últimos cuatro dígitos de la tarjeta del pago, o null si el movimiento no
                // salió de una tarjeta.
                //
                // Se traen SOLO los últimos cuatro con Substring, no el número completo: así el
                // número entero nunca sale de la base para una consulta de historial, aunque
                // alguien agregue un log de la respuesta más adelante.
                //
                // Substring de EF se traduce a SUBSTRING de SQL Server, que cuenta desde 1: para
                // los últimos 4 de un número de 16 dígitos, arranca en la posición 13.
                movimiento.tarjeta_id == null
                    ? null
                    : context.Tarjetas
                        .Where(t => t.id == movimiento.tarjeta_id)
                        .Select(t => t.numero.Substring(12, 4))
                        .FirstOrDefault(),
                // La contraparte: una transferencia se guarda como dos movimientos (el débito de
                // quien envía y el crédito de quien recibe) que comparten transferencia_id. Es el
                // titular de la cuenta del OTRO movimiento con ese mismo transferencia_id.
                //
                // "transferencia_id != null" no es redundante: EF compara con la semántica de C#,
                // donde null == null da verdadero. Sin esa condición, un depósito (que no tiene
                // transferencia_id) encontraría como "contraparte" a cualquier otro depósito.
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