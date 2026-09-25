using Microsoft.AspNetCore.Identity;

namespace DigitalArs.Api.Helpers.Common;

// Convierte los errores que devuelve Identity en mensajes que se le pueden mostrar a la persona.
public static class MensajesDeIdentity
{
    public static string[] Traducir(IdentityResult resultado) =>
        resultado.Errors.Select(MensajeSeguro).ToArray();

    // Los errores de contraseña se muestran porque ayudan a corregirla; Identity los escribe en
    // inglés, así que se traducen. El resto se generaliza para no revelar si un email o un
    // documento ya estaban registrados.
    private static string MensajeSeguro(IdentityError error) => error.Code switch
    {
        "PasswordTooShort" => "La contraseña es demasiado corta.",
        "PasswordRequiresNonAlphanumeric" => "La contraseña debe tener al menos un símbolo (por ejemplo ! o #).",
        "PasswordRequiresDigit" => "La contraseña debe tener al menos un número.",
        "PasswordRequiresLower" => "La contraseña debe tener al menos una letra minúscula.",
        "PasswordRequiresUpper" => "La contraseña debe tener al menos una letra mayúscula.",
        _ when error.Code.StartsWith("Password") => "La contraseña no cumple los requisitos de seguridad.",
        _ => "No se pudo completar la operación con los datos proporcionados."
    };
}
