using System.Security.Cryptography;
using System.Text;
using DigitalArs.Api.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace DigitalArs.Api.Services;

public static class DevelopmentSetup
{
    public static void ConfigureJwt(WebApplicationBuilder builder)
    {
        if (!builder.Environment.IsDevelopment() || !string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Key"]))
            return;
        var project = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
            Path.GetFullPath(builder.Environment.ContentRootPath).ToUpperInvariant())))[..16];
        var root = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (string.IsNullOrWhiteSpace(root))
            throw new InvalidOperationException("No se encontró una carpeta privada local para guardar Jwt:Key.");
        builder.Configuration["Jwt:Key"] = GetOrCreateKey(Path.Combine(root, "DigitalArs", project, "jwt.key"));
    }

    public static string GetOrCreateKey(string path)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        if (!File.Exists(path))
        {
            var temporary = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
            try
            {
                File.WriteAllText(temporary, Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)));
                try { File.Move(temporary, path, overwrite: false); }
                catch (IOException) when (File.Exists(path)) { /* Another process published its key first. */ }
            }
            finally { if (File.Exists(temporary)) File.Delete(temporary); }
        }
        var key = File.ReadAllText(path).Trim();
        if (Encoding.UTF8.GetByteCount(key) < 32)
            throw new InvalidOperationException("La clave JWT local guardada no es válida. Revisá el archivo jwt.key.");
        return key;
    }

    public static async Task InitializeIdentityAsync(IServiceProvider services)
    {
        var auth = services.GetRequiredService<AuthDbContext>();
        await using var transaction = await auth.Database.BeginTransactionAsync();
        await auth.Database.ExecuteSqlRawAsync("""
            DECLARE @result int;
            EXEC @result = sp_getapplock @Resource = 'DigitalArs.IdentityStartup',
                @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 30000;
            IF @result < 0 THROW 50004, 'No se pudo preparar Identity: otra instancia está inicializando.', 1;
            IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
                THROW 50005, 'Faltan las tablas del proyecto. Ejecutá el script Create en esta base.', 1;
            """);
        using var stream = typeof(DevelopmentSetup).Assembly.GetManifestResourceStream("DigitalArs.Api.Data.Sql.001_Identity.sql")
            ?? throw new InvalidOperationException("Falta el recurso 001_Identity.sql en el proyecto.");
        using var reader = new StreamReader(stream);
        await auth.Database.ExecuteSqlRawAsync(await reader.ReadToEndAsync());
        await IdentitySetup.EnsureRolesAsync(services);
        await transaction.CommitAsync();
    }
}
