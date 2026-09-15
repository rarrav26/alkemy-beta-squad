using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

public class TransferenciaDto
{
    [Required(ErrorMessage = "El alias o CVU de destino es obligatorio.")]
    public string? Destino { get; set; }
}