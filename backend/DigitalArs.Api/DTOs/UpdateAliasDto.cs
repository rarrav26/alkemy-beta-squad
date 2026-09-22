using System.ComponentModel.DataAnnotations;
using DigitalArs.Api.Helpers.Domain;

namespace DigitalArs.Api.DTOs;

public class UpdateAliasDto
{
    // El patrón sale de DatosDeCuenta, el mismo lugar que genera los alias y que valida el
    // destino de una transferencia. Acá se acepta mayúscula porque el servicio normaliza a
    // minúsculas antes de guardar; si se rechazara en el DTO, escribir "Auto.Perro.Gato"
    // fallaría antes de llegar a esa normalización.
    [Required]
    [StringLength(50, MinimumLength = DatosDeCuenta.LargoMinimoAlias)]
    [RegularExpression(
        DatosDeCuenta.PatronAliasSinDistinguirMayusculas,
        ErrorMessage = "El alias debe ser tres palabras separadas por puntos (ejemplo: auto.perro.gato).")]
    public string Alias { get; set; } = null!;
}
