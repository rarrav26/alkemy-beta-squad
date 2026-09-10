using System.ComponentModel.DataAnnotations;
namespace DigitlaArs.Api.DTOs;
public class UserProfileDto
{
    [Required, StringLength(100)] public string Nombre { get; set; } = "";
    [Required, StringLength(100)] public string Apellido { get; set; } = "";
    [Required, EmailAddress, StringLength(256)] public string Email { get; set; } = "";
    [Required, StringLength(20)] public string TipoDocumento { get; set; } = "";
    [Required, StringLength(20)] public string NroDocumento { get; set; } = "";
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
