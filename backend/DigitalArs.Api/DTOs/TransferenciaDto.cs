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
        var destino = (Destino ?? "").Trim();

        if (!DatosDeCuenta.EsDestinoValido(destino))
        {
            yield return new ValidationResult(
                "El destino debe ser un alias (ej. auto.perro.gato) o un CVU de 22 dígitos.",
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