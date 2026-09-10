using System.Net;
using DigitalArs.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

static class AutomaticSetupChecks
{
    public static async Task RunAsync()
    {
        var folder = Path.Combine(Path.GetTempPath(), "digitalars-setup-test-" + Guid.NewGuid().ToString("N"));
        var path = Path.Combine(folder, "jwt.key");
        try
        {
            var keys = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => Task.Run(() => DevelopmentSetup.GetOrCreateKey(path))));
            Check(keys.Distinct().Count() == 1, "Arranques simultáneos usan la misma clave");
            Check(Convert.FromBase64String(keys[0]).Length == 64, "Clave generada con 64 bytes aleatorios");
            Check(DevelopmentSetup.GetOrCreateKey(path) == keys[0], "La clave persiste entre arranques");
            File.WriteAllText(path, "invalid");
            try { DevelopmentSetup.GetOrCreateKey(path); throw new Exception("Aceptó clave inválida"); }
            catch (InvalidOperationException) { Check(true, "No reemplaza silenciosamente una clave dañada"); }
        }
        finally { if (Directory.Exists(folder)) Directory.Delete(folder, recursive: true); }

        var environment = new TestEnvironment();
        var configuration = new ConfigurationBuilder().Build();
        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = IPAddress.Loopback;
        context.Request.Host = new HostString("localhost", 7201);
        context.Request.Headers.Origin = "http://localhost:5173";
        Check(LocalSetupAccess.IsAllowed(context, environment, configuration), "Permite frontend local en Development");
        environment.EnvironmentName = "Production";
        Check(!LocalSetupAccess.IsAllowed(context, environment, configuration), "Production nunca omite la clave de configuración");
        environment.EnvironmentName = "Development";
        context.Connection.RemoteIpAddress = IPAddress.Parse("192.168.1.10");
        Check(!LocalSetupAccess.IsAllowed(context, environment, configuration), "Rechaza clientes de la red local");
        context.Connection.RemoteIpAddress = IPAddress.Loopback;
        context.Request.Host = new HostString("attacker.example");
        Check(!LocalSetupAccess.IsAllowed(context, environment, configuration), "Rechaza Host externo aunque conecte por loopback");
        context.Request.Host = new HostString("localhost", 7201);
        context.Request.Headers.Origin = "https://attacker.example";
        Check(!LocalSetupAccess.IsAllowed(context, environment, configuration), "Rechaza origen externo");
        context.Request.Headers.Origin = "http://localhost:9999";
        Check(!LocalSetupAccess.IsAllowed(context, environment, configuration), "Rechaza origen local no autorizado");
        context.Request.Headers.Origin = "http://localhost:5173";
        context.Request.Headers["X-Forwarded-For"] = "192.168.1.10";
        Check(!LocalSetupAccess.IsAllowed(context, environment, configuration), "Rechaza acceso reenviado por proxy");
        context.Request.Headers.Remove("X-Forwarded-For");
        context.Connection.RemoteIpAddress = IPAddress.Parse("::ffff:127.0.0.1");
        Check(LocalSetupAccess.IsAllowed(context, environment, configuration), "Acepta loopback IPv4 mapeado a IPv6");
    }

    private static void Check(bool condition, string message)
    {
        if (!condition) throw new Exception(message);
        Console.WriteLine("PASS: " + message);
    }

    private sealed class TestEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "Tests";
        public string ContentRootPath { get; set; } = "";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
