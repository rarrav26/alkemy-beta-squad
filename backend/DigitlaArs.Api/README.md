# DigitalArs.Api

API REST en ASP.NET Core 10 + EF Core 10 (Database First) sobre SQL Server.

## Requisitos

- .NET SDK 10
- SQL Server con la base `DigitalArs` ya creada
- Herramienta EF Core CLI (solo si vas a re-generar entidades):

```powershell
dotnet tool install --global dotnet-ef
```

## Setup local (hacelo una sola vez al clonar)

**1. Copiá la plantilla de configuración:**

```powershell
Copy-Item Properties/launchSettings.Example.json Properties/launchSettings.json
```

**2. Abrí `Properties/launchSettings.json` y ajustá `ConnectionStrings__DefaultConnection`
a tu instancia de SQL Server.** Según cómo tengas instalado el motor, el `Server=` cambia:

| Tu instalación                        | Valor de `Server=`               |
| ------------------------------------- | -------------------------------- |
| SQL Server Express (lo más común acá) | `.\SQLEXPRESS01` — es el default |
| SQL Server, instancia por defecto     | `localhost`                      |
| Docker / puerto explícito             | `localhost,1433`                 |

> En JSON la barra invertida se escribe doble: `Server=.\\SQLEXPRESS01`. En PowerShell,
> con comillas simples, va simple: `Server=.\SQLEXPRESS01`.

Este archivo **no se versiona** (está en `.gitignore`).

**3. Levantá la API:** F5 en Visual Studio, o desde esta carpeta:

```powershell
dotnet run
```

**4. Swagger:** https://localhost:58162/swagger

Si falta la cadena de conexión, la API **no arranca** y tira un error que te dice exactamente
qué archivo copiar. Es a propósito: es mejor fallar al arrancar que descubrir el problema
en el primer request.

## Cómo se configura la conexión

La cadena se define como **variable de entorno**, no en los `appsettings`. .NET traduce `__`
(dos guiones bajos) a `:` en la clave de configuración:

```
Variable de entorno:  ConnectionStrings__DefaultConnection
Clave de configuración:  ConnectionStrings:DefaultConnection
Se lee en Program.cs:    builder.Configuration.GetConnectionString("DefaultConnection")
```

Las variables de entorno tienen **más prioridad** que cualquier `appsettings*.json`, así que
si la variable está definida, gana. `WebApplication.CreateBuilder` ya incluye el proveedor de
variables de entorno: no hace falta instalar ninguna librería tipo `dotenv` (eso es de Node,
.NET trae el sistema de configuración incorporado).

La ventaja de este mecanismo es que **es el mismo nombre de variable en todos lados**: en local
lo pone `launchSettings.json`, y en Azure / Docker / IIS lo define el entorno del servidor. No
hay que cambiar código para desplegar.

### Reglas del proyecto

- **Ningún `appsettings*.json` lleva credenciales ni cadenas de conexión reales.**
  `appsettings.json` tiene la clave `DefaultConnection` vacía solo para documentar que existe.
- Si necesitás correr un comando de `dotnet` sin perfil de arranque, exportá la variable a mano:

```powershell
$env:ConnectionStrings__DefaultConnection='Server=.\SQLEXPRESS01;Database=DigitalArs;Trusted_Connection=True;TrustServerCertificate=True;'
```

## Scaffolding Database First

El modelo de datos se genera **desde la base** (Database First), no con migraciones. Desde la
carpeta `backend/DigitlaArs.Api`, con la variable de entorno exportada como se muestra arriba:

```powershell
dotnet ef dbcontext scaffold "$env:ConnectionStrings__DefaultConnection" Microsoft.EntityFrameworkCore.SqlServer --project "DigitalArs.Api.csproj" --startup-project "DigitalArs.Api.csproj" --context DigitalArsDbContext --context-dir Data/Context --output-dir Data/Entities --namespace DigitalArs.Api.Data.Entities --context-namespace DigitalArs.Api.Data.Context --no-onconfiguring --use-database-names --force
```

`--no-onconfiguring` es importante: evita que el scaffolding escriba la cadena de conexión
hardcodeada dentro del `DbContext`.

## Estructura

```
Controllers/      endpoints HTTP
Interfaces/       contratos de repositorios
Repositories/     acceso a datos vía DbContext
Data/Context/     DigitalArsDbContext (generado por scaffolding)
Data/Entities/    entidades (generadas por scaffolding)
```

Flujo: `Controller` → `Interface` → `Repository` → `DbContext`.
