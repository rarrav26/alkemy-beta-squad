using System.ComponentModel.DataAnnotations;
namespace DigitlaArs.Api.DTOs;
public class SetupAdminDto : RegisterDto
{
    [StringLength(512)] public string? SetupKey { get; set; }
}
