using DigitalArs.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;

namespace DigitalArs.Api.Services;

// El alta devuelve los registros creados o los errores, nunca las dos cosas. Cuenta queda en
// null cuando el rol no lleva cuenta en pesos, que es el caso del administrador.
public record ResultadoDeAlta(IdentityUser? UsuarioIdentity, Usuario? Perfil, Cuenta? Cuenta, string[] Errores)
{
    public bool Exitoso => UsuarioIdentity is not null;

    public static ResultadoDeAlta Exito(IdentityUser usuarioIdentity, Usuario perfil, Cuenta? cuenta) =>
        new(usuarioIdentity, perfil, cuenta, []);

    public static ResultadoDeAlta Fallo(params string[] errores) => new(null, null, null, errores);
}
