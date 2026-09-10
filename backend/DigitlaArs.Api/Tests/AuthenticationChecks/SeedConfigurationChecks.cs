using System.ComponentModel.DataAnnotations;
using DigitalArs.Api.Services;
using Microsoft.Extensions.Configuration;

static class SeedConfigurationChecks
{
    public static void Run()
    {
        var values = new Dictionary<string, string?>
        {
            ["BootstrapAdmin:Nombre"] = "Admin", ["BootstrapAdmin:Apellido"] = "Prueba",
            ["BootstrapAdmin:Email"] = "admin@example.test", ["BootstrapAdmin:TipoDocumento"] = "DNI",
            ["BootstrapAdmin:NroDocumento"] = "TEST-001", ["BootstrapAdmin:Password"] = "SoloParaTests123!"
        };
        IConfiguration Config() => new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        var dto = DatabaseSeeder.ReadAdminConfiguration(Config());
        Check(dto.Email == "admin@example.test" && dto.TipoDocumento == "DNI", "Seed lee credenciales de configuración privada");
        try { DatabaseSeeder.ReadAdminConfiguration(new ConfigurationBuilder().Build()); throw new Exception("Seed aceptó configuración ausente"); }
        catch (InvalidOperationException) { Check(true, "Seed exige configuración si falta administrador"); }
        values["BootstrapAdmin:Password"] = "";
        Invalid(Config(), "Seed rechaza contraseña vacía");
        values["BootstrapAdmin:Password"] = "short";
        Invalid(Config(), "Seed rechaza contraseña demasiado corta");
        values["BootstrapAdmin:Password"] = "SoloParaTests123!";
        values["BootstrapAdmin:Email"] = "invalid";
        Invalid(Config(), "Seed rechaza email inválido");
        values["BootstrapAdmin:Email"] = "admin@example.test";
        values["BootstrapAdmin:NroDocumento"] = "";
        Invalid(Config(), "Seed exige documento para el perfil Database First");
        values["BootstrapAdmin:NroDocumento"] = "TEST-001";
        values["BootstrapAdmin:TipoDocumento"] = "OTRO";
        try { DatabaseSeeder.ReadAdminConfiguration(Config()); throw new Exception("Tipo inválido aceptado"); }
        catch (InvalidOperationException) { Check(true, "Seed respeta los tipos de documento del esquema SQL"); }
    }
    private static void Invalid(IConfiguration configuration, string label)
    {
        try { DatabaseSeeder.ReadAdminConfiguration(configuration); throw new Exception(label); }
        catch (ValidationException) { Check(true, label); }
    }
    private static void Check(bool condition, string label)
    {
        if (!condition) throw new Exception(label);
        Console.WriteLine("PASS: " + label);
    }
}
