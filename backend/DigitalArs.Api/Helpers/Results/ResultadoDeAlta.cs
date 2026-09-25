using DigitalArs.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;

namespace DigitalArs.Api.Helpers.Results;

// Lo que devuelve el alta por dentro de AccountService: los registros creados o los errores,
// nunca las dos cosas. Cuenta queda en null cuando el rol no lleva cuenta en pesos, que es el
// caso del administrador.
//
// Es interno a propósito: lleva entidades, así que no sale de la capa de servicios. Lo que
// llega al controller son RegistroResponse y UsuarioCreadoResponse, ya armados.
internal record ResultadoDeAlta(IdentityUser? UsuarioIdentity, Usuario? Perfil, Cuenta? Cuenta, string[] Errores)
{
    public bool Exitoso => UsuarioIdentity is not null;

    public static ResultadoDeAlta Exito(IdentityUser usuarioIdentity, Usuario perfil, Cuenta? cuenta) =>
        new(usuarioIdentity, perfil, cuenta, []);

    public static ResultadoDeAlta Fallo(params string[] errores) => new(null, null, null, errores);
}
