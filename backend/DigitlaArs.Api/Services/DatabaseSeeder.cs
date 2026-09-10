using System.ComponentModel.DataAnnotations;
using DigitalArs.Api.Data.Context;
using DigitlaArs.Api.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Services;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        var auth = services.GetRequiredService<AuthDbContext>();
        using var stream = typeof(DatabaseSeeder).Assembly.GetManifestResourceStream("DigitalArs.Api.Data.Sql.002_ReferenceData.sql")
            ?? throw new InvalidOperationException("Falta el recurso 002_ReferenceData.sql.");
        using var reader = new StreamReader(stream);
        await auth.Database.ExecuteSqlRawAsync(await reader.ReadToEndAsync());
        await EnsureAdminAsync(services, configuration);
    }

    public static async Task EnsureAdminAsync(IServiceProvider services, IConfiguration configuration)
    {
        var users = services.GetRequiredService<UserManager<IdentityUser>>();
        var db = services.GetRequiredService<DigitalArsDbContext>();
        var admins = await users.GetUsersInRoleAsync("Administrador");
        if (admins.Count > 0)
        {
            // Existing credentials, profile and active status are never overwritten.
            var ids = admins.Select(u => u.Id).ToArray();
            if (!await db.Usuarios.AnyAsync(u => ids.Contains(u.identity_user_id!)))
                throw new InvalidOperationException("Identity tiene un administrador sin perfil Usuarios. Revisá la coherencia de la base.");
            return;
        }
        var dto = ReadAdminConfiguration(configuration);
        var result = await services.GetRequiredService<AccountService>().CreateAsync(dto, dto.Password, "Administrador");
        // Another seed instance may have created the administrator while this one waited.
        if (result.Errors.Contains("SETUP_COMPLETED")) return;
        if (result.User is null)
            throw new InvalidOperationException("No se pudo crear el administrador inicial: " + string.Join(" ", result.Errors));
    }

    public static RegisterDto ReadAdminConfiguration(IConfiguration configuration)
    {
        var section = configuration.GetSection("BootstrapAdmin");
        if (!section.Exists())
            throw new InvalidOperationException("No existe administrador. Configurá BootstrapAdmin en los secretos del proyecto (Visual Studio: Administrar secretos de usuario) o en el gestor de secretos del servidor.");
        var dto = new RegisterDto
        {
            Nombre = section["Nombre"] ?? "", Apellido = section["Apellido"] ?? "",
            Email = section["Email"] ?? "", TipoDocumento = section["TipoDocumento"] ?? "",
            NroDocumento = section["NroDocumento"] ?? "", Password = section["Password"] ?? ""
        };
        Validator.ValidateObject(dto, new ValidationContext(dto), validateAllProperties: true);
        if (dto.TipoDocumento is not ("DNI" or "PASAPORTE"))
            throw new InvalidOperationException("BootstrapAdmin:TipoDocumento debe ser DNI o PASAPORTE.");
        return dto;
    }
}
