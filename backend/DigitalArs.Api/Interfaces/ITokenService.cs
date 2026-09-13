using DigitalArs.Api.DTOs;
using Microsoft.AspNetCore.Identity;

namespace DigitalArs.Api.Interfaces;

public interface ITokenService
{
    Task<SesionResponse> CrearToken(IdentityUser user, int usuarioId);
}
