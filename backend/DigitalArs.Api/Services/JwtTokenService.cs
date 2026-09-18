using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DigitalArs.Api.DTOs;
using DigitalArs.Api.Helpers.Configuration;
using DigitalArs.Api.Helpers.Domain;
using DigitalArs.Api.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace DigitalArs.Api.Services;

public class JwtTokenService(IOptions<JwtOptions> options, UserManager<IdentityUser> users) : ITokenService
{
    public async Task<SesionResponse> CrearToken(IdentityUser user, int usuarioId)
    {
        var settings = options.Value;
        var roles = await users.GetRolesAsync(user);
        var expires = DateTime.UtcNow.AddMinutes(settings.ExpirationMinutes);

        var claims = await ArmarClaims(user, usuarioId, roles);
        var token = new JwtSecurityToken(settings.Issuer, settings.Audience, claims,
            notBefore: DateTime.UtcNow, expires: expires,
            signingCredentials: FirmaCon(settings.Key));

        return new SesionResponse(
            new JwtSecurityTokenHandler().WriteToken(token), RolPrincipal.DeLosRoles(roles), expires, usuarioId);
    }

    private async Task<List<Claim>> ArmarClaims(IdentityUser user, int usuarioId, IList<string> roles)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Name, user.Email!),
            new("usuarioId", usuarioId.ToString()),
            // El stamp viaja en el token para poder revocarlo: si cambia en la base, deja de coincidir.
            new("security_stamp", await users.GetSecurityStampAsync(user))
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        return claims;
    }

    private static SigningCredentials FirmaCon(string key) =>
        new(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
}
