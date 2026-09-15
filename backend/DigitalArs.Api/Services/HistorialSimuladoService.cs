using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;

namespace DigitalArs.Api.Services;

// TODO HU-011: reemplazar por la implementación que consulta la tabla Movimientos.
//
// Devuelve los datos inventados de MovimientosDeEjemplo para desbloquear al
// front. Filtra y pagina de verdad a propósito: un simulador que ignora los
// parámetros no sirve para probar el paginador ni los filtros.
//
// No recibe repositorios en el constructor porque no toca la base: funciona
// aunque no haya nada cargado. La implementación real sí va a resolver el
// usuario y la cuenta desde identityUserId, y por eso el contrato ya devuelve
// Resultado<T>: cuando aparezcan los rechazos, el controller no cambia.
public class HistorialSimuladoService : IHistorialService
{
    public Task<Resultado<PaginaResponse<MovimientoResponse>>> ConsultarAsync(
        string identityUserId,
        HistorialMovimientosDto filtros,
        CancellationToken cancellationToken = default)
    {
        var movimientos = MovimientosDeEjemplo.Todos;

        movimientos = FiltrarPorFechas(movimientos, filtros.Desde, filtros.Hasta);
        movimientos = FiltrarPorSigno(movimientos, filtros.Tipo);

        var pagina = ArmarPagina(movimientos, filtros.Page, filtros.PageSize);

        return Task.FromResult(
            Resultado<PaginaResponse<MovimientoResponse>>.Exito(pagina));
    }

    // Desde y Hasta son días completos e incluidos: un movimiento del 10 a las
    // 23:00 entra tanto en ?desde=2026-09-10 como en ?hasta=2026-09-10.
    private static IReadOnlyList<MovimientoResponse> FiltrarPorFechas(
        IReadOnlyList<MovimientoResponse> movimientos,
        DateTime? desde,
        DateTime? hasta)
    {
        var filtrados = movimientos.AsEnumerable();

        if (desde is DateTime inicio)
        {
            filtrados = filtrados.Where(
                movimiento => movimiento.Fecha.Date >= inicio.Date);
        }

        if (hasta is DateTime fin)
        {
            filtrados = filtrados.Where(
                movimiento => movimiento.Fecha.Date <= fin.Date);
        }

        return filtrados.ToList();
    }

    private static IReadOnlyList<MovimientoResponse> FiltrarPorSigno(
        IReadOnlyList<MovimientoResponse> movimientos,
        string? tipo)
    {
        var signo = SignoDeMovimiento.DesdeFiltro(tipo);

        if (signo is null)
            return movimientos;

        return movimientos
            .Where(movimiento => movimiento.Signo == signo)
            .ToList();
    }

    private static PaginaResponse<MovimientoResponse> ArmarPagina(
        IReadOnlyList<MovimientoResponse> movimientos,
        int page,
        int pageSize)
    {
        var totalItems = movimientos.Count;
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

        var items = movimientos
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new PaginaResponse<MovimientoResponse>(
            Items: items,
            Page: page,
            PageSize: pageSize,
            TotalItems: totalItems,
            TotalPages: totalPages);
    }
}
