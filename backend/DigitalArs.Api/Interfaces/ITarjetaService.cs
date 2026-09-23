using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Results;

namespace DigitalArs.Api.Interfaces;

// Todos los métodos reciben el identityUserId y resuelven la cuenta adentro: el controller
// nunca manda un id de tarjeta ni de cuenta, así un usuario no puede nombrar la tarjeta de
// otro. El único dato que llega de afuera es el que viene firmado en el token.
public interface ITarjetaService
{
    Task<Resultado<TarjetaResponse>> GenerarAsync(
        string identityUserId,
        CancellationToken cancellationToken = default);

    Task<Resultado<TarjetaResponse>> ObtenerMiTarjetaAsync(
        string identityUserId,
        CancellationToken cancellationToken = default);

    // Devuelve el número completo y el código de seguridad. Exige la contraseña.
    Task<Resultado<TarjetaSecretoResponse>> RevelarAsync(
        string identityUserId,
        string password,
        CancellationToken cancellationToken = default);

    // Un solo método para congelar y descongelar: son la misma transición en dos sentidos y
    // separarlas duplicaría las mismas cinco validaciones.
    Task<Resultado<TarjetaResponse>> CambiarCongelamientoAsync(
        string identityUserId,
        bool congelada,
        CancellationToken cancellationToken = default);

    Task<Resultado<TarjetaResponse>> DarDeBajaAsync(
        string identityUserId,
        CancellationToken cancellationToken = default);
}
