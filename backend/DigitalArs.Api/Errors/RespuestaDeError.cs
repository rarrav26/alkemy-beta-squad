using DigitalArs.Api.Helpers.Results;

namespace DigitalArs.Api.Errors;

// Todos los servicios devuelven Resultado<T>, así que el cuerpo del error siempre se arma
// igual. Lo que cambia entre endpoints es el status code, y eso lo sigue eligiendo cada
// controller con su propio switch.
public static class RespuestaDeError
{
    public static ErrorResponse Desde<T>(Resultado<T> resultado, string mensajePorDefecto)
        where T : class => new()
    {
        Code = resultado.Motivo?.ToString(),
        Message = resultado.Errores.FirstOrDefault() ?? mensajePorDefecto,
        Errors = resultado.Errores
    };
}
