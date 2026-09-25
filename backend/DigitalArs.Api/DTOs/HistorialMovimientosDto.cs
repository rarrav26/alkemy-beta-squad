using System.ComponentModel.DataAnnotations;
using DigitalArs.Api.Helpers.Domain;

namespace DigitalArs.Api.DTOs;

// Filtros del historial. Llega por query string ([FromQuery]), no por body:
// es un GET.
//
// Todos los campos son opcionales. Sin ninguno, el endpoint devuelve la primera
// página con los 5 movimientos más recientes.
public class HistorialMovimientosDto : IValidatableObject
{
    /// <example>1</example>
    [Range(1, int.MaxValue, ErrorMessage = "La página debe ser mayor a cero.")]
    public int Page { get; set; } = 1;

    // El tope evita que una sola llamada se traiga el historial entero.
    /// <example>5</example>
    [Range(1, 50, ErrorMessage = "El tamaño de página debe estar entre 1 y 50.")]
    public int PageSize { get; set; } = 5;

    // Desde, Hasta y Busqueda no llevan <example> a propósito: Swagger UI prellena el filtro con
    // el ejemplo y el "Try it out" devolvería un historial recortado sin que se note.
    /// <summary>Día de calendario argentino, incluido (yyyy-MM-dd).</summary>
    public DateTime? Desde { get; set; }

    /// <summary>Día de calendario argentino, incluido (yyyy-MM-dd).</summary>
    public DateTime? Hasta { get; set; }

    /// <summary>credito, debito o todas.</summary>
    /// <example>todas</example>
    public string? Tipo { get; set; }

    // Texto libre del buscador. Filtra por el nombre del tipo de movimiento, ignorando
    // mayúsculas y acentos. Un texto que no coincide con ningún tipo devuelve una página
    // vacía, no un error: no encontrar nada es un resultado válido.
    /// <summary>Busca por el nombre del tipo de movimiento, sin distinguir mayúsculas ni acentos.</summary>
    [StringLength(100, ErrorMessage = "La búsqueda no puede superar los 100 caracteres.")]
    public string? Busqueda { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (ElRangoDeFechasEstaInvertido())
        {
            yield return new ValidationResult(
                "La fecha 'desde' no puede ser posterior a la fecha 'hasta'.",
                [nameof(Desde), nameof(Hasta)]);
        }

        if (!SignoDeMovimiento.EsFiltroValido(Tipo))
        {
            yield return new ValidationResult(
                $"El tipo debe ser {SignoDeMovimiento.ValoresAceptados}.",
                [nameof(Tipo)]);
        }
    }

    private bool ElRangoDeFechasEstaInvertido()
    {
        if (Desde is not DateTime desde)
            return false;

        if (Hasta is not DateTime hasta)
            return false;

        return desde.Date > hasta.Date;
    }
}
