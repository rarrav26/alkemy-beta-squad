namespace DigitalArs.Api.DTOs;

// Lo que devuelve ÚNICAMENTE el endpoint de revelado, después de validar la contraseña.
// Es un record aparte de TarjetaResponse a propósito: son los dos datos sensibles y tenerlos
// en su propio tipo hace evidente en el código qué endpoints los pueden devolver.
//
// Nunca se escribe en logs. El front lo muestra unos segundos y lo descarta.
/// <param name="Numero">Los 16 dígitos, sin separadores (ejemplo: 4000111122223333).</param>
/// <param name="CodigoDeSeguridad">El código de seguridad de 3 dígitos (ejemplo: 123).</param>
public record TarjetaSecretoResponse(
    string Numero,
    string CodigoDeSeguridad
);
