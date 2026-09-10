# DigitalArs.Api - Setup EF Core Database First

## Requisitos

- .NET SDK 10
- SQL Server con base `DigitalArs`
- Herramienta EF Core CLI:

```powershell
dotnet tool install --global dotnet-ef
```

## Variable de entorno de conexión (Development)

Configurar la cadena por variable de entorno (no versionar credenciales):

```powershell
$env:ConnectionStrings__DefaultConnection='Data Source=.\SQLEXPRESS01;Initial Catalog=DigitalArs;Integrated Security=True;Persist Security Info=False;Pooling=False;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Application Name=SQL Server Management Studio;Command Timeout=0'
```

### launchSettings.json (Visual Studio / `dotnet run` con perfil)

`Properties/launchSettings.json` está en `.gitignore` porque cada desarrollador apunta a su propia instancia de SQL Server. Creá el archivo localmente (no se versiona) con este contenido, ajustando `ConnectionStrings__DefaultConnection` a tu entorno:

```json
{
  "$schema": "https://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5261",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development",
        "ConnectionStrings__DefaultConnection": "Server=.\\SQLEXPRESS01;Database=DigitalArs;Trusted_Connection=True;TrustServerCertificate=True;"
      }
    },
    "https": {
      "applicationUrl": "https://localhost:7201;http://localhost:5261",
      "commandName": "Project",
      "dotnetRunMessages": true,
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development",
        "ConnectionStrings__DefaultConnection": "Server=.\\SQLEXPRESS01;Database=DigitalArs;Trusted_Connection=True;TrustServerCertificate=True;"
      },
      "launchBrowser": false
    }
  }
}
```

## Scaffolding Database First

Desde la carpeta `backend/DigitlaArs.Api`:

```powershell
dotnet ef dbcontext scaffold "$env:ConnectionStrings__DefaultConnection" Microsoft.EntityFrameworkCore.SqlServer --project "DigitalArs.Api.csproj" --startup-project "DigitalArs.Api.csproj" --context DigitalArsDbContext --context-dir Data/Context --output-dir Data/Entities --namespace DigitalArs.Api.Data.Entities --context-namespace DigitalArs.Api.Data.Context --no-onconfiguring --use-database-names --force
```

## Ejecución

```powershell
dotnet restore
dotnet build
dotnet run --project DigitalArs.Api.csproj
```
