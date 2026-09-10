using DigitlaArs.Api.DTOs;
using Microsoft.AspNetCore.Identity;
namespace DigitalArs.Api.Interfaces;
public interface ITokenService
{
    Task<AuthResponse> CrearToken(IdentityUser user, int usuarioId);
}
