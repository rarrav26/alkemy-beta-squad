using Microsoft.AspNetCore.Identity;
namespace DigitalArs.Api.Services;

public static class IdentitySetup
{
    public static async Task EnsureRolesAsync(IServiceProvider services)
    {
        var roles = services.GetRequiredService<RoleManager<IdentityRole>>();
        foreach (var name in new[] { "Administrador", "Usuario" })
            if (!await roles.RoleExistsAsync(name))
            {
                var result = await roles.CreateAsync(new IdentityRole(name));
                if (!result.Succeeded) throw new InvalidOperationException("No se pudo crear el rol " + name);
            }
    }

    public static async Task CreateAdminAsync(IServiceProvider services, IConfiguration configuration)
    {
        await EnsureRolesAsync(services);
        await DatabaseSeeder.EnsureAdminAsync(services, configuration);
    }
}
