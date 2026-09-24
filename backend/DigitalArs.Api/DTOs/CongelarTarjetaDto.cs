using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

public class CongelarTarjetaDto
{
    // Es bool? y no bool por el mismo motivo que EstadoActivoDto: con un bool común, un cuerpo
    // vacío llegaría como false y descongelaría la tarjeta sin que nadie lo haya pedido.
    /// <summary>true congela la tarjeta; false la descongela.</summary>
    /// <example>true</example>
    [Required(ErrorMessage = "Indicá si la tarjeta se congela o se descongela.")]
    public bool? Congelada { get; set; }
}
