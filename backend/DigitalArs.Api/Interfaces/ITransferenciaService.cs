using DigitalArs.Api.DTOs;
using DigitalArs.Api.Services;

namespace DigitalArs.Api.Interfaces;

public interface ITransferenciaService
{
    Task<Resultado<DestinoResponseDto>> ResolverDestinoAsync(
        string identityUserId,
        TransferenciaDto dto,
        CancellationToken cancellationToken = default);

    Task<Resultado<TransferenciaResponseDto>> TransferirAsync(
        string identityUserId,
        TransferenciaDto dto,
        CancellationToken cancellationToken = default);
}