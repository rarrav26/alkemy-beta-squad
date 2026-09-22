using System.ComponentModel.DataAnnotations;
using DigitalArs.Api.Helpers.Domain;

namespace DigitalArs.Api.DTOs;

public class UpdateAliasDto
{
    // El alias que el usuario elige es SOLO LETRAS. El formato de tres palabras separadas por
    // punto corresponde únicamente al alias autogenerado al crear la cuenta, y no se acepta
    // acá. El patrón sale de DatosDeCuenta para no repetir la regla en dos lugares.
    // Se admiten mayúsculas porque el servicio normaliza a minúsculas antes de guardar; si se
    // rechazaran acá, escribir "MariaGonzalez" fallaría antes de llegar a esa normalización.
    [Required]
    [StringLength(DatosDeCuenta.LargoMaximoAlias, MinimumLength = DatosDeCuenta.LargoMinimoAlias)]
    [RegularExpression(
        DatosDeCuenta.PatronAliasPersonalizadoSinDistinguirMayusculas,
        ErrorMessage = "El alias solo puede contener letras, sin espacios ni números.")]
    public string Alias { get; set; } = null!;
}
