using System.ComponentModel.DataAnnotations;

namespace DigitalArs.Api.DTOs;

public class EstadoActivoDto
{
    // Es bool? y no bool para que [Required] pueda distinguir "mandaron false" de "no mandaron
    // nada": con un bool común, un cuerpo vacío llegaría como false y desactivaría al usuario.
    /// <summary>false desactiva al usuario y cierra sus sesiones; true lo reactiva.</summary>
    /// <example>false</example>
    [Required]
    public bool? IsActive { get; set; }
}
