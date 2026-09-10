using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DigitalArs.Api.Interfaces;
using DigitlaArs.Api.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
namespace DigitalArs.Api.Services;
public class JwtTokenService(IOptions<JwtOptions> options, UserManager<IdentityUser> users) : ITokenService
{
    public async Task<AuthResponse> CrearToken(IdentityUser user, int usuarioId)
    {
        var settings = options.Value;
        var roles = await users.GetRolesAsync(user);
        var expires = DateTime.UtcNow.AddMinutes(settings.ExpirationMinutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Name, user.Email!),
            new("usuarioId", usuarioId.ToString()),
            new("security_stamp", await users.GetSecurityStampAsync(user))
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        var token = new JwtSecurityToken(settings.Issuer, settings.Audience, claims,
            notBefore: DateTime.UtcNow, expires: expires,
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Key)), SecurityAlgorithms.HmacSha256));
        return new(new JwtSecurityTokenHandler().WriteToken(token), roles.FirstOrDefault() ?? "Usuario", expires, usuarioId);
    }
}
