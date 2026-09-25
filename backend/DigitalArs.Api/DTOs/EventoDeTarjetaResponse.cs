namespace DigitalArs.Api.DTOs;

// Un hecho de la bitácora de tarjetas, como lo lee el administrador.
//
// Lleva los últimos cuatro dígitos de la tarjeta a la que pertenece: un usuario pudo tener
// varias tarjetas a lo largo del tiempo, y sin eso no se distingue "congeló la misma tarjeta
// tres veces" de "congeló tres tarjetas distintas".
/// <param name="Tipo">GENERADA, CONGELADA, DESCONGELADA o DADA_DE_BAJA.</param>
/// <param name="UltimosCuatro">Los últimos 4 dígitos de la tarjeta del evento.</param>
/// <param name="Fecha">Cuándo pasó, con huso incluido.</param>
public record EventoDeTarjetaResponse(
    string Tipo,
    string UltimosCuatro,
    DateTimeOffset Fecha
);
