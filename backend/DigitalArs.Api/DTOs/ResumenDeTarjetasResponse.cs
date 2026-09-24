namespace DigitalArs.Api.DTOs;

// Resumen de la actividad de tarjetas de un usuario, para el administrador.
//
// Los contadores salen de TarjetaEventos y NO del estado actual de las tarjetas: el estado dice
// cómo está la tarjeta hoy, y eso no puede responder "cuántas veces la congeló". Una tarjeta
// ACTIVA pudo haber sido congelada y descongelada cinco veces.
//
// Cuenta TODAS las tarjetas que tuvo el usuario, incluidas las dadas de baja: es justamente el
// historial lo que se quiere ver.
/// <param name="UsuarioId">El usuario auditado.</param>
/// <param name="TarjetasGeneradas">Cuántas tarjetas generó en total.</param>
/// <param name="VecesQueCongelo">Cuántas veces congeló alguna de sus tarjetas.</param>
/// <param name="VecesQueDescongelo">Cuántas veces la descongeló.</param>
/// <param name="TarjetasDadasDeBaja">Cuántas dio de baja.</param>
/// <param name="TieneTarjetaVigente">Si hoy tiene una tarjeta activa o congelada.</param>
/// <param name="EstadoActual">ACTIVA, CONGELADA o null si no tiene ninguna vigente.</param>
/// <param name="PagosRealizados">Cuántos pagos hizo con tarjeta.</param>
/// <param name="TotalPagado">Suma de esos pagos.</param>
/// <param name="Eventos">La bitácora, más reciente primero. Los contadores de arriba son su resumen.</param>
public record ResumenDeTarjetasResponse(
    int UsuarioId,
    int TarjetasGeneradas,
    int VecesQueCongelo,
    int VecesQueDescongelo,
    int TarjetasDadasDeBaja,
    bool TieneTarjetaVigente,
    string? EstadoActual,
    int PagosRealizados,
    decimal TotalPagado,
    IReadOnlyList<EventoDeTarjetaResponse> Eventos
);
