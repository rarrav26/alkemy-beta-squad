using System.ComponentModel.DataAnnotations;
using DigitalArs.Api.Services;

namespace DigitalArs.Api.DTOs;

public class TransferenciaDto : IValidatableObject
{
    [Required(ErrorMessage = "El alias o CVU de destino es obligatorio.")]
    public string? Destino { get; set; }

    [Required(ErrorMessage = "El importe es obligatorio.")]
    public decimal? Importe { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        // Se normaliza igual que al guardar un alias (recorte y minúsculas): los alias se
        // almacenan en minúsculas, así que escribir "MariaGonzalez" tiene que ser válido.
        // Sobre un CVU, que son dígitos, normalizar no cambia nada.
        var destino = DatosDeCuenta.NormalizarAlias(Destino);

        if (!DatosDeCuenta.EsDestinoValido(destino))
        {
            // Se nombran las DOS formas de alias a propósito: el autogenerado con puntos y el
            // personalizado de solo letras. Mencionar una sola haría creer que la otra no sirve.
            yield return new ValidationResult(
                "El destino debe ser un alias (auto.perro.gato o mariagonzalez) o un CVU de 22 dígitos.",
                [nameof(Destino)]);
        }

        if (Importe is not decimal importe)
            yield break;

        var error = LimitesDeImporte.PrimerErrorDe(importe);

        if (error is not null)
        {
            yield return new ValidationResult(error, [nameof(Importe)]);
        }
    }
}