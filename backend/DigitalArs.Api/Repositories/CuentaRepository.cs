using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.Helpers.Domain;
using DigitalArs.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Repositories;

public class CuentaRepository(DigitalArsDbContext context) : ICuentaRepository
{
    public Task<Cuenta?> GetByUsuarioIdAsync(
        int usuarioId,
        CancellationToken cancellationToken = default)
    {
        return context.Cuentas
            .AsNoTracking()
            .SingleOrDefaultAsync(
                cuenta => cuenta.usuario_id == usuarioId,
                cancellationToken);
    }

    public async Task<bool> IncrementarSaldoAsync(
        int usuarioId,
        decimal importe,
        CancellationToken cancellationToken = default)
    {
        var filasActualizadas = await context.Cuentas
            .Where(cuenta =>
                cuenta.usuario_id == usuarioId &&
                cuenta.usuario.is_active &&
                cuenta.saldo <= LimitesDeImporte.SaldoMaximo - importe)
            .ExecuteUpdateAsync(
                cambios => cambios.SetProperty(
                    cuenta => cuenta.saldo,
                    cuenta => cuenta.saldo + importe),
                cancellationToken);

        return filasActualizadas == 1;
    }

    public async Task<bool> DecrementarSaldoAsync(
        int usuarioId,
        decimal importe,
        CancellationToken cancellationToken = default)
    {
        var filasActualizadas = await context.Cuentas
            .Where(cuenta =>
                cuenta.usuario_id == usuarioId &&
                cuenta.usuario.is_active &&
                cuenta.saldo >= importe)
            .ExecuteUpdateAsync(
                cambios => cambios.SetProperty(
                    cuenta => cuenta.saldo,
                    cuenta => cuenta.saldo - importe),
                cancellationToken);

        return filasActualizadas == 1;
    }

    public Task<Cuenta?> GetByAliasOCvuAsync(
        string destino,
        CancellationToken cancellationToken = default)
    {
        return context.Cuentas
            .Include(cuenta => cuenta.usuario)
            .AsNoTracking()
            .SingleOrDefaultAsync(
                cuenta => cuenta.alias == destino || cuenta.cvu == destino,
                cancellationToken);
    }
}