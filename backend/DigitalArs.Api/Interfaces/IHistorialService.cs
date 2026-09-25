using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Results;

namespace DigitalArs.Api.Interfaces;

// Consultar el historial es una responsabilidad distinta de depositar, por eso
// no se agrega a IDepositoService.
//
// La cuenta se resuelve siempre desde identityUserId (el usuario del token) y
// nunca desde un parámetro de la request: así un usuario no puede pedir los
// movimientos de otra cuenta.
public interface IHistorialService
{
    Task<Resultado<PaginaResponse<MovimientoResponse>>> ConsultarAsync(
        string identityUserId,
        HistorialMovimientosDto filtros,
        CancellationToken cancellationToken = default);
}
