using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;

namespace DigitalArs.Api.Services;

public class HistorialService(
    IUsuarioRepository usuarios,
    ICuentaRepository cuentas,
    IMovimientoRepository movimientos) : IHistorialService
{
    public async Task<Resultado<PaginaResponse<MovimientoResponse>>> ConsultarAsync(
        string identityUserId,
        HistorialMovimientosDto filtros,
        CancellationToken cancellationToken = default)
    {
        var usuario = await usuarios.GetByIdentityUserIdAsync(
            identityUserId,
            cancellationToken);

        if (usuario is null)
        {
            return Fallo(
                MotivoDeRechazo.NoEncontrado,
                "No se encontró el usuario.");
        }

        if (!usuario.is_active)
        {
            return Fallo(
                MotivoDeRechazo.UsuarioDesactivado,
                "Tu usuario está desactivado.");
        }

        var cuenta = await cuentas.GetByUsuarioIdAsync(
            usuario.id,
            cancellationToken);

        if (cuenta is null)
        {
            return Fallo(
                MotivoDeRechazo.CuentaNoEncontrada,
                "No tenés una cuenta asociada.");
        }

        var pagina = await movimientos.ListarPaginaAsync(
            ArmarFiltro(cuenta.id, filtros),
            cancellationToken);

        return Resultado<PaginaResponse<MovimientoResponse>>.Exito(
            ArmarRespuesta(pagina, filtros));
    }

    // Traduce lo que manda el front (días de calendario argentinos y la palabra credito/debito/todas) 
    private static FiltroDeMovimientos ArmarFiltro(
        int cuentaId,
        HistorialMovimientosDto filtros) =>
        new(
            CuentaId: cuentaId,
            DesdeUtc: HoraDeArgentina.ComienzoDelDiaEnUtc(filtros.Desde),
            HastaUtc: HoraDeArgentina.ComienzoDelDiaSiguienteEnUtc(filtros.Hasta),
            TiposIncluidos: SignoDeMovimiento.TiposDelFiltro(filtros.Tipo),
            Page: filtros.Page,
            PageSize: filtros.PageSize);

    private static PaginaResponse<MovimientoResponse> ArmarRespuesta(
        PaginaDeMovimientos pagina,
        HistorialMovimientosDto filtros)
    {
        var items = pagina.Items.Select(ComoFila).ToList();

        // Sin movimientos, totalPages queda en 0 y la respuesta sigue siendo 200
        var totalPages = (int)Math.Ceiling(
            pagina.TotalItems / (double)filtros.PageSize);

        return new PaginaResponse<MovimientoResponse>(
            Items: items,
            Page: filtros.Page,
            PageSize: filtros.PageSize,
            TotalItems: pagina.TotalItems,
            TotalPages: totalPages);
    }

    private static MovimientoResponse ComoFila(MovimientoLeido movimiento) =>
        new(
            Id: movimiento.Id,
            Fecha: HoraDeArgentina.DesdeUtc(movimiento.FechaUtc),
            Tipo: movimiento.Tipo,
            Signo: SignoDeMovimiento.DeTipo(movimiento.Tipo),
            Importe: movimiento.Importe);

    private static Resultado<PaginaResponse<MovimientoResponse>> Fallo(
        MotivoDeRechazo motivo,
        string mensaje) =>
        Resultado<PaginaResponse<MovimientoResponse>>.Fallo(motivo, mensaje);
}
