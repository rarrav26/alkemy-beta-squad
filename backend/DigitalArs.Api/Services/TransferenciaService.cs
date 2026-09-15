using DigitalArs.Api.DTOs;
using DigitalArs.Api.Interfaces;

namespace DigitalArs.Api.Services;

public class TransferenciaService(ICuentaRepository cuentas) : ITransferenciaService
{
    public async Task<Resultado<DestinoResponseDto>> ResolverDestinoAsync(
        TransferenciaDto dto,
        CancellationToken cancellationToken = default)
    {
        var destino = (dto.Destino ?? "").Trim();

        var cuenta = await cuentas.GetByAliasOCvuAsync(destino, cancellationToken);

        if (cuenta is null)
        {
            return Resultado<DestinoResponseDto>.Fallo(
                MotivoDeRechazo.DestinoNoEncontrado,
                "No se encontró ninguna cuenta con ese alias o CVU.");
        }

        var respuesta = new DestinoResponseDto(
            Id: cuenta.id,
            Alias: cuenta.alias,
            Cvu: cuenta.cvu);

        return Resultado<DestinoResponseDto>.Exito(respuesta);
    }
}