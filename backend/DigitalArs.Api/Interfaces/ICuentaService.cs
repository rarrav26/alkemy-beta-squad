using DigitalArs.Api.DTOs;
using DigitalArs.Api.Services;

namespace DigitalArs.Api.Interfaces;

public interface ICuentaService
{
    Task<Resultado<CuentaResponse>> ObtenerMiCuentaAsync(
        string identityUserId,
        CancellationToken cancellationToken = default);
}