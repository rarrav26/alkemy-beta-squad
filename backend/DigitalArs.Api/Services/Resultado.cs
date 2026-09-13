namespace DigitalArs.Api.Services;

// Lo que devuelve un servicio: o salió bien y trae la respuesta lista, o falló y trae el motivo.
// Nunca las dos cosas. Errores solo se completa cuando hay una lista de mensajes para mostrar,
// como los que devuelve Identity al rechazar una contraseña.
//
// T queda restringido a clases para que "Valor is not null" signifique exactamente "salió bien":
// todas las respuestas de la API son records, así que la restricción no molesta.
public record Resultado<T>(T? Valor, MotivoDeRechazo? Motivo, string[] Errores) where T : class
{
    public bool Exitoso => Valor is not null;

    public static Resultado<T> Exito(T valor) => new(valor, null, []);

    public static Resultado<T> Fallo(MotivoDeRechazo motivo, params string[] errores) =>
        new(null, motivo, errores);
}
