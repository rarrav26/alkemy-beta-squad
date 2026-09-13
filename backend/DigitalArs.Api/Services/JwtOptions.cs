using System.ComponentModel.DataAnnotations;
namespace DigitalArs.Api.Services;
public class JwtOptions
{
    [Required] public string Key { get; set; } = "";
    [Required] public string Issuer { get; set; } = "DigitalArs.Api";
    [Required] public string Audience { get; set; } = "DigitalArs.Frontend";
    [Range(1, 120)] public int ExpirationMinutes { get; set; } = 60;
}
