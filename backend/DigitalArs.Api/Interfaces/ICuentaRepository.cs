using DigitalArs.Api.Data.Entities;

namespace DigitalArs.Api.Interfaces;

public interface ICuentaRepository
{
    Task<Cuenta?> GetByUsuarioIdAsync(
        int usuarioId,
        CancellationToken cancellationToken = default);

    Task<bool> IncrementarSaldoAsync(
        int usuarioId,
        decimal importe,
        CancellationToken cancellationToken = default);

    Task<Cuenta?> GetByAliasOCvuAsync(
        string destino,
        CancellationToken cancellationToken = default);
}