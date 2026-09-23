using System.ComponentModel.DataAnnotations;
using DigitalArs.Api.Helpers.Domain;

namespace DigitalArs.Api.DTOs;

public class DepositoDto : IValidatableObject
{
    /// <summary>Mayor a cero y con 2 decimales como máximo.</summary>
    /// <example>5000</example>
    [Required(ErrorMessage = "El importe es obligatorio.")]
    public decimal? Importe { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (Importe is not decimal importe)
            yield break;

        var error = LimitesDeImporte.PrimerErrorDe(importe);

        if (error is not null)
        {
            yield return new ValidationResult(error, [nameof(Importe)]);
        }
    }
}