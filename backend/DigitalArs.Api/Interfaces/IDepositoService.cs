using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Results;

namespace DigitalArs.Api.Interfaces;

public interface IDepositoService
{
    Task<Resultado<DepositoResponse>> DepositarAsync(
        string identityUserId,
        DepositoDto dto,
        CancellationToken cancellationToken = default);
}