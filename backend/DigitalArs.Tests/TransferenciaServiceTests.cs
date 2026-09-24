using DigitalArs.Api.Data.Context;
using DigitalArs.Api.Data.Entities;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Domain;
using DigitalArs.Api.Helpers.Results;
using DigitalArs.Api.Interfaces;
using DigitalArs.Api.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace DigitalArs.Tests;

public class TransferenciaServiceTests
{
    private readonly Mock<ICuentaRepository> _mockCuentas;
    private readonly Mock<IUsuarioRepository> _mockUsuarios;
    private readonly Mock<ITipoMovimientoRepository> _mockTiposMovimiento;

    public TransferenciaServiceTests()
    {
        _mockCuentas = new Mock<ICuentaRepository>();
        _mockUsuarios = new Mock<IUsuarioRepository>();
        _mockTiposMovimiento = new Mock<ITipoMovimientoRepository>();
    }

    private DigitalArsDbContext CrearContextoEnMemoria()
    {
        var options = new DbContextOptionsBuilder<DigitalArsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new DigitalArsDbContext(options);
    }

    [Fact]
    public async Task TransferirAsync_ImporteInvalido_DeberiaFallar()
    {
        // Arrange
        await using var context = CrearContextoEnMemoria();
        var service = new TransferenciaService(_mockCuentas.Object, _mockUsuarios.Object, _mockTiposMovimiento.Object, context);
        var dto = new TransferenciaDto { Destino = "alias.destino", Importe = -50m };

        // Act
        var resultado = await service.TransferirAsync("user-id", dto);

        // Assert
        Assert.False(resultado.Exitoso);
        Assert.Equal(MotivoDeRechazo.DatosInvalidos, resultado.Motivo);
    }

    [Fact]
    public async Task TransferirAsync_SaldoInsuficiente_DeberiaFallar()
    {
        // Arrange
        await using var context = CrearContextoEnMemoria();
        var usuarioEmisor = new Usuario { id = 1, identity_user_id = "user-1", is_active = true };
        var cuentaOrigen = new Cuenta { id = 1, usuario_id = 1, saldo = 100m, alias = "origen.alias" };
        var usuarioDestino = new Usuario { id = 2, is_active = true };
        var cuentaDestino = new Cuenta { id = 2, usuario_id = 2, saldo = 50m, alias = "destino.alias", usuario = usuarioDestino };

        _mockUsuarios.Setup(u => u.GetByIdentityUserIdAsync("user-1", It.IsAny<CancellationToken>()))
                     .ReturnsAsync(usuarioEmisor);
        _mockCuentas.Setup(c => c.GetByUsuarioIdAsync(1, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(cuentaOrigen);
        _mockCuentas.Setup(c => c.GetByAliasOCvuAsync("destino.alias", It.IsAny<CancellationToken>()))
                    .ReturnsAsync(cuentaDestino);

        var service = new TransferenciaService(_mockCuentas.Object, _mockUsuarios.Object, _mockTiposMovimiento.Object, context);
        var dto = new TransferenciaDto { Destino = "destino.alias", Importe = 500m };

        // Act
        var resultado = await service.TransferirAsync("user-1", dto);

        // Assert
        Assert.False(resultado.Exitoso);
        Assert.Equal(MotivoDeRechazo.SaldoInsuficiente, resultado.Motivo);
    }

    [Fact]
    public async Task TransferirAsync_CuentaDestinoInexistente_DeberiaFallar()
    {
        // Arrange
        await using var context = CrearContextoEnMemoria();
        var usuarioEmisor = new Usuario { id = 1, identity_user_id = "user-1", is_active = true };
        var cuentaOrigen = new Cuenta { id = 1, usuario_id = 1, saldo = 1000m };

        _mockUsuarios.Setup(u => u.GetByIdentityUserIdAsync("user-1", It.IsAny<CancellationToken>()))
                     .ReturnsAsync(usuarioEmisor);
        _mockCuentas.Setup(c => c.GetByUsuarioIdAsync(1, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(cuentaOrigen);
        _mockCuentas.Setup(c => c.GetByAliasOCvuAsync("inexistente.alias", It.IsAny<CancellationToken>()))
                    .ReturnsAsync((Cuenta?)null);

        var service = new TransferenciaService(_mockCuentas.Object, _mockUsuarios.Object, _mockTiposMovimiento.Object, context);
        var dto = new TransferenciaDto { Destino = "inexistente.alias", Importe = 100m };

        // Act
        var resultado = await service.TransferirAsync("user-1", dto);

        // Assert
        Assert.False(resultado.Exitoso);
        Assert.Equal(MotivoDeRechazo.DestinoNoEncontrado, resultado.Motivo);
    }

    [Fact]
    public async Task TransferirAsync_CuentaDestinoInactiva_DeberiaFallar()
    {
        // Arrange
        await using var context = CrearContextoEnMemoria();
        var usuarioEmisor = new Usuario { id = 1, identity_user_id = "user-1", is_active = true };
        var cuentaOrigen = new Cuenta { id = 1, usuario_id = 1, saldo = 1000m };
        var usuarioDestinoInactivo = new Usuario { id = 2, is_active = false };
        var cuentaDestino = new Cuenta { id = 2, usuario_id = 2, saldo = 0m, usuario = usuarioDestinoInactivo };

        _mockUsuarios.Setup(u => u.GetByIdentityUserIdAsync("user-1", It.IsAny<CancellationToken>()))
                     .ReturnsAsync(usuarioEmisor);
        _mockCuentas.Setup(c => c.GetByUsuarioIdAsync(1, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(cuentaOrigen);
        _mockCuentas.Setup(c => c.GetByAliasOCvuAsync("destino.inactivo", It.IsAny<CancellationToken>()))
                    .ReturnsAsync(cuentaDestino);

        var service = new TransferenciaService(_mockCuentas.Object, _mockUsuarios.Object, _mockTiposMovimiento.Object, context);
        var dto = new TransferenciaDto { Destino = "destino.inactivo", Importe = 100m };

        // Act
        var resultado = await service.TransferirAsync("user-1", dto);

        // Assert
        Assert.False(resultado.Exitoso);
        Assert.Equal(MotivoDeRechazo.UsuarioDesactivado, resultado.Motivo);
    }

    [Fact]
    public async Task TransferirAsync_MismaCuenta_DeberiaFallar()
    {
        // Arrange
        await using var context = CrearContextoEnMemoria();
        var usuarioEmisor = new Usuario { id = 1, identity_user_id = "user-1", is_active = true };
        var cuentaOrigen = new Cuenta { id = 1, usuario_id = 1, saldo = 1000m, alias = "mi.propio.alias" };

        _mockUsuarios.Setup(u => u.GetByIdentityUserIdAsync("user-1", It.IsAny<CancellationToken>()))
                     .ReturnsAsync(usuarioEmisor);
        _mockCuentas.Setup(c => c.GetByUsuarioIdAsync(1, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(cuentaOrigen);
        _mockCuentas.Setup(c => c.GetByAliasOCvuAsync("mi.propio.alias", It.IsAny<CancellationToken>()))
                    .ReturnsAsync(cuentaOrigen);

        var service = new TransferenciaService(_mockCuentas.Object, _mockUsuarios.Object, _mockTiposMovimiento.Object, context);
        var dto = new TransferenciaDto { Destino = "mi.propio.alias", Importe = 100m };

        // Act
        var resultado = await service.TransferirAsync("user-1", dto);

        // Assert
        Assert.False(resultado.Exitoso);
        Assert.Equal(MotivoDeRechazo.MismaCuenta, resultado.Motivo);
    }

    [Fact]
    public async Task TransferirAsync_FalloEnCredito_DeberiaRevertirYRetornarNoSePudoActualizar()
    {
        // Arrange: Simula atomicidad cuando el débito sale bien pero el crédito al receptor falla
        await using var context = CrearContextoEnMemoria();
        var usuarioEmisor = new Usuario { id = 1, identity_user_id = "user-1", is_active = true };
        var cuentaOrigen = new Cuenta { id = 1, usuario_id = 1, saldo = 1000m, alias = "origen.alias" };
        var usuarioDestino = new Usuario { id = 2, is_active = true };
        var cuentaDestino = new Cuenta { id = 2, usuario_id = 2, saldo = 100m, alias = "destino.alias", usuario = usuarioDestino };

        _mockUsuarios.Setup(u => u.GetByIdentityUserIdAsync("user-1", It.IsAny<CancellationToken>()))
                     .ReturnsAsync(usuarioEmisor);
        _mockCuentas.Setup(c => c.GetByUsuarioIdAsync(1, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(cuentaOrigen);
        _mockCuentas.Setup(c => c.GetByAliasOCvuAsync("destino.alias", It.IsAny<CancellationToken>()))
                    .ReturnsAsync(cuentaDestino);

        // El débito funciona pero el crédito falla
        _mockCuentas.Setup(c => c.DecrementarSaldoAsync(1, 200m, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(true);
        _mockCuentas.Setup(c => c.IncrementarSaldoAsync(2, 200m, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(false);

        var service = new TransferenciaService(_mockCuentas.Object, _mockUsuarios.Object, _mockTiposMovimiento.Object, context);
        var dto = new TransferenciaDto { Destino = "destino.alias", Importe = 200m };

        // Act
        var resultado = await service.TransferirAsync("user-1", dto);

        // Assert
        Assert.False(resultado.Exitoso);
        Assert.Equal(MotivoDeRechazo.NoSePudoActualizar, resultado.Motivo);
        // Verifica que no se haya guardado ningún movimiento en la base de datos
        Assert.Empty(context.Movimientos);
    }
}