using DigitlaArs.Api.DTOs;
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
        var users = services.GetRequiredService<UserManager<IdentityUser>>();
        await EnsureRolesAsync(services);
        if ((await users.GetUsersInRoleAsync("Administrador")).Count > 0)
            throw new InvalidOperationException("Ya existe un administrador; el alta inicial está deshabilitada.");
        var dto = configuration.GetSection("BootstrapAdmin").Get<RegisterDto>()
            ?? throw new InvalidOperationException("Configurá BootstrapAdmin mediante variables de entorno.");
        System.ComponentModel.DataAnnotations.Validator.ValidateObject(dto,
            new System.ComponentModel.DataAnnotations.ValidationContext(dto), validateAllProperties: true);
        var result = await services.GetRequiredService<AccountService>().CreateAsync(dto, dto.Password, "Administrador");
        if (result.User is null) throw new InvalidOperationException(string.Join(" ", result.Errors));
        Console.WriteLine("Administrador creado. Quitá las variables BootstrapAdmin.");
    }
}
