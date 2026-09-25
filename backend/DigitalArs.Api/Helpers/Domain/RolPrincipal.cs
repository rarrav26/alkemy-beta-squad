namespace DigitalArs.Api.Helpers.Domain;

// Un usuario puede tener más de un rol; al frontend se le informa el de mayor alcance.
// La regla vive en un solo lugar para que el login y /api/auth/me nunca informen roles
// distintos de la misma persona.
public static class RolPrincipal
{
    public const string Administrador = "Administrador";
    public const string Usuario = "Usuario";

    public static string DeLosRoles(IList<string> roles)
    {
        if (roles.Contains(Administrador)) return Administrador;
        return Usuario;
    }
}
