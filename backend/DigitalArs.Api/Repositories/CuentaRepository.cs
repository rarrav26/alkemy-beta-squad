using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Repositories;

public class CuentaRepository(DigitalArsDbContext context)
    : ICuentaRepository
{
    private const decimal SaldoMaximo = 9999999999999999.99m;

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
        if (importe <= 0 ||
            importe > SaldoMaximo ||
            decimal.Round(importe, 2) != importe)
        {
            return false;
        }

        var filasActualizadas = await context.Cuentas
            .Where(cuenta =>
                cuenta.usuario_id == usuarioId &&
                cuenta.usuario.is_active &&
                cuenta.saldo <= SaldoMaximo - importe)
            .ExecuteUpdateAsync(
                cambios => cambios.SetProperty(
                    cuenta => cuenta.saldo,
                    cuenta => cuenta.saldo + importe),
                cancellationToken);

        return filasActualizadas == 1;
    }
}