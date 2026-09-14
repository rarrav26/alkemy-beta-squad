using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

public class DepositoDto : IValidatableObject
{
    [Required(ErrorMessage = "El importe es obligatorio.")]
    public decimal? Importe { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (Importe is not decimal importe)
            yield break;

        if (importe <= 0)
        {
            yield return new ValidationResult(
                "El importe debe ser mayor a cero.",
                new[] { nameof(Importe) });
        }

        if (decimal.Round(importe, 2) != importe)
        {
            yield return new ValidationResult(
                "El importe debe tener como máximo 2 decimales.",
                new[] { nameof(Importe) });
        }

        if (importe > 9999999999999999.99m)
        {
            yield return new ValidationResult(
                "El importe supera el máximo permitido.",
                new[] { nameof(Importe) });
        }
    }
}