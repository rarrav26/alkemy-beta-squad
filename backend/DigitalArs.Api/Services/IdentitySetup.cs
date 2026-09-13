using System.ComponentModel.DataAnnotations;
using DigitalArs.Api.DTOs;
using Microsoft.AspNetCore.Identity;

namespace DigitalArs.Api.Services;

public static class IdentitySetup
{
    private static readonly string[] RolesDelSistema = ["Administrador", "Usuario"];

    public static async Task EnsureRolesAsync(IServiceProvider services)
    {
        var roles = services.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var nombre in RolesDelSistema)
        {
            if (await roles.RoleExistsAsync(nombre)) continue;

            var creado = await roles.CreateAsync(new IdentityRole(nombre));
            if (!creado.Succeeded) throw new InvalidOperationException("No se pudo crear el rol " + nombre);
        }
    }

    public static async Task CreateAdminAsync(IServiceProvider services, IConfiguration configuration)
    {
        var users = services.GetRequiredService<UserManager<IdentityUser>>();
        await EnsureRolesAsync(services);

        if ((await users.GetUsersInRoleAsync("Administrador")).Count > 0)
            throw new InvalidOperationException("Ya existe un administrador; el alta inicial está deshabilitada.");

        var dto = LeerDatosDelAdministrador(configuration);
        ValidarDatosDelAdministrador(dto);

        var accounts = services.GetRequiredService<AccountService>();
        var resultado = await accounts.CreateAsync(dto, dto.Password, "Administrador");
        if (!resultado.Exitoso) throw new InvalidOperationException(string.Join(" ", resultado.Errores));

        Console.WriteLine("Administrador creado. Quitá las variables BootstrapAdmin.");
    }

    private static RegistroDto LeerDatosDelAdministrador(IConfiguration configuration) =>
        configuration.GetSection("BootstrapAdmin").Get<RegistroDto>()
            ?? throw new InvalidOperationException("Configurá BootstrapAdmin mediante variables de entorno.");

    // Los datos vienen de variables de entorno, no de un request, así que nadie los validó antes.
    private static void ValidarDatosDelAdministrador(RegistroDto dto) =>
        Validator.ValidateObject(dto, new ValidationContext(dto), validateAllProperties: true);
}
