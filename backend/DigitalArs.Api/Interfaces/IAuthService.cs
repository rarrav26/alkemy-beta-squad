using DigitalArs.Api.DTOs;
using DigitalArs.Api.Services;

namespace DigitalArs.Api.Interfaces;

// Las operaciones con las que una persona entra a la aplicación. El servicio aplica las reglas
// y devuelve el motivo cuando rechaza; traducir ese motivo a HTTP es tarea del controller.
public interface IAuthService
{
    Task<Resultado<SesionResponse>> LoginAsync(InicioSesionDto dto, CancellationToken cancellationToken = default);

    Task<Resultado<SesionResponse>> DefinirPrimeraPasswordAsync(
        PrimeraPasswordDto dto, CancellationToken cancellationToken = default);

    // Null cuando no hay un perfil activo para esa cuenta: quien la pide ya no puede operar.
    Task<PerfilResponse?> ObtenerPerfilAsync(string identityUserId, CancellationToken cancellationToken = default);
}
