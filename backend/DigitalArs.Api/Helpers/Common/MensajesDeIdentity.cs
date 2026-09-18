using Microsoft.AspNetCore.Identity;

namespace DigitalArs.Api.Helpers.Common;

// Convierte los errores que devuelve Identity en mensajes que se le pueden mostrar a la persona.
public static class MensajesDeIdentity
{
    public static string[] Traducir(IdentityResult resultado) =>
        resultado.Errors.Select(MensajeSeguro).ToArray();

    // Los errores de contraseña se muestran tal cual porque ayudan a corregirla. El resto se
    // generaliza para no revelar si un email o un documento ya estaban registrados.
    private static string MensajeSeguro(IdentityError error)
    {
        if (error.Code.StartsWith("Password")) return error.Description;
        return "No se pudo completar la operación con los datos proporcionados.";
    }
}
