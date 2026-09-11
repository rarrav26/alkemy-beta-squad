using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
namespace DigitlaArs.Api.DTOs;
public class UserProfileDto : IValidatableObject
{
    [Required, StringLength(100)] public string Nombre { get; set; } = "";
    [Required, StringLength(100)] public string Apellido { get; set; } = "";
    [Required, EmailAddress, StringLength(256)] public string Email { get; set; } = "";
    [Required, StringLength(20)] public string TipoDocumento { get; set; } = "";
    [Required, StringLength(20)] public string NroDocumento { get; set; } = "";


    private static readonly Regex DniPattern = new(@"^\d{7,8}$", RegexOptions.Compiled);
    private static readonly Regex PasaportePattern = new(@"^[A-Za-z]{2,3}\d{6,7}$", RegexOptions.Compiled);

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var nro = (NroDocumento ?? "").Trim();
        switch (TipoDocumento?.Trim())
        {
            case "DNI":
                if (!DniPattern.IsMatch(nro))
                    yield return new ValidationResult(
                        "El DNI debe tener entre 7 y 8 dígitos numéricos.", [nameof(NroDocumento)]);
                break;
            case "PASAPORTE":
                if (!PasaportePattern.IsMatch(nro))
                    yield return new ValidationResult(
                        "El pasaporte debe tener 2 o 3 letras seguidas de 6 o 7 números (ej. AB123456).", [nameof(NroDocumento)]);
                break;
            default:
                yield return new ValidationResult(
                    "El tipo de documento debe ser DNI o PASAPORTE.", [nameof(TipoDocumento)]);
                break;
        }
    }
}
public class InitialPasswordDto
{
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required] public string InvitationToken { get; set; } = "";
    [Required, StringLength(128, MinimumLength = 8)] public string Password { get; set; } = "";
    [Required, Compare(nameof(Password))] public string ConfirmPassword { get; set; } = "";
}
public class ActiveStatusDto
{
    [Required] public bool? IsActive { get; set; }
}
public record AuthResponse(string Token, string Role, DateTime ExpiresAt, int UsuarioId);
