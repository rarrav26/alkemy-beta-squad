using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Results;

namespace DigitalArs.Api.Interfaces;

public interface ICuentaService
{
    Task<Resultado<CuentaResponse>> ObtenerMiCuentaAsync(
        string identityUserId,
        CancellationToken cancellationToken = default);
}