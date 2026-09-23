using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace DigitalArs.Api.DTOs;

// Datos comunes a las dos formas de dar de alta un usuario: el autorregistro, que agrega la
// contraseña en RegistroDto, y el alta que hace un administrador, que la deja para después.
public class PerfilUsuarioDto : IValidatableObject
{
    /// <example>Ana</example>
    [Required, StringLength(100)]
    public string Nombre { get; set; } = "";

    /// <example>Perez</example>
    [Required, StringLength(100)]
    public string Apellido { get; set; } = "";

    /// <example>ana@ejemplo.com</example>
    [Required, EmailAddress, StringLength(256)]
    public string Email { get; set; } = "";

    /// <summary>DNI o PASAPORTE.</summary>
    /// <example>DNI</example>
    [Required, StringLength(20)]
    public string TipoDocumento { get; set; } = "";

    // El ejemplo va entre comillas: sin ellas se publica como número y el "Try it out" de
    // Swagger manda un cuerpo que no se puede deserializar.
    /// <summary>DNI: 7 u 8 dígitos. PASAPORTE: 2 o 3 letras seguidas de 6 o 7 números.</summary>
    /// <example>"12345678"</example>
    [Required, StringLength(20)]
    public string NroDocumento { get; set; } = "";

    private static readonly Regex FormatoDni = new(@"^\d{7,8}$", RegexOptions.Compiled);
    private static readonly Regex FormatoPasaporte = new(@"^[A-Za-z]{2,3}\d{6,7}$", RegexOptions.Compiled);

    // El formato válido del número depende del tipo de documento elegido, así que no alcanza
    // con un atributo sobre la propiedad: hay que mirar las dos juntas.
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var numero = NroDocumento?.Trim() ?? "";

        switch (TipoDocumento?.Trim())
        {
            case "DNI":
                if (!FormatoDni.IsMatch(numero))
                    yield return new ValidationResult(
                        "El DNI debe tener entre 7 y 8 dígitos numéricos.", [nameof(NroDocumento)]);
                break;

            case "PASAPORTE":
                if (!FormatoPasaporte.IsMatch(numero))
                    yield return new ValidationResult(
                        "El pasaporte debe tener 2 o 3 letras seguidas de 6 o 7 números (ej. AB123456).", [nameof(NroDocumento)]);
                break;

            default:
                yield return new ValidationResult(
                    "El tipo de documento debe ser DNI o PASAPORTE.", [nameof(TipoDocumento)]);
                break;
        }
    }
}
