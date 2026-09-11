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

## Autenticación con Identity y JWT

La API usa Identity para almacenar contraseñas hasheadas y JWT firmado con HS256 para acceder.
AuthDbContext administra las siete tablas AspNet*, separado del contexto Database First.
Usuarios.identity_user_id vincula el perfil con AspNetUsers.Id.
No ejecutar EnsureCreated sobre DigitalArs: la base ya contiene tablas de negocio.
No se modifican ni migran automáticamente usuarios existentes sin vínculo Identity.

### Preparación local (PowerShell, desde esta carpeta)

La conexión del perfil de desarrollo apunta a .\SQLEXPRESS01 / DigitalArs.
SQL Server debe estar iniciado y tu cuenta Windows debe tener acceso a esa base.
Si usás otra conexión, ajustá el perfil de Properties/launchSettings.json o ejecutá sin perfil
y configurá ConnectionStrings__DefaultConnection y ASPNETCORE_ENVIRONMENT=Development.

1. Configurá una clave aleatoria local (una sola vez; no subirla al repositorio):

```powershell
$keyBytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($keyBytes)
dotnet user-secrets set "Jwt:Key" ([Convert]::ToBase64String($keyBytes))
dotnet build
dotnet run --no-build -- --init-identity
dotnet run --no-build --launch-profile https
```

El comando init-identity agrega las tablas Identity si no existen y crea los roles Usuario/Administrador.
Si encuentra parte de las tablas Identity, se detiene para evitar completar un esquema incompatible.
Si ya están las siete, las conserva; se espera el modelo estándar de Identity de .NET 10.
Alternativamente, un administrador de SQL puede ejecutar Data/Sql/001_Identity.sql en DigitalArs.
La API crea los roles al arrancar. El script no borra ni altera las tablas de negocio.

Swagger: https://localhost:7201/swagger (perfil https).
Configurá el certificado de desarrollo con dotnet dev-certs https --trust si tu equipo todavía no confía en él.
En producción, suministrá Jwt__Key desde un gestor de secretos y conservá las claves de Data Protection
de forma persistente y compartida entre instancias: las invitaciones dependen de ellas.

### Primer administrador

El registro público siempre asigna Usuario. Nunca acepta un rol proporcionado por el cliente.
Para el primer Administrador, configurá estas variables con datos reales en tu consola local:

```powershell
$env:BootstrapAdmin__Nombre = 'Nombre'
$env:BootstrapAdmin__Apellido = 'Apellido'
$env:BootstrapAdmin__Email = 'administrador@ejemplo.com'
$env:BootstrapAdmin__TipoDocumento = 'DNI'
$env:BootstrapAdmin__NroDocumento = 'DOCUMENTO_REAL'
$credential = Get-Credential -UserName $env:BootstrapAdmin__Email -Message 'Contraseña inicial del administrador'
$env:BootstrapAdmin__Password = $credential.GetNetworkCredential().Password
dotnet run --no-build -- --bootstrap-admin
Remove-Item Env:BootstrapAdmin__Password
$credential = $null
```

El comando se niega a crear otro administrador si ya existe uno. No hay contraseñas ni usuarios de prueba predefinidos.
La contraseña debe tener al menos ocho caracteres, mayúscula, minúscula, número y símbolo (máximo 128).

### Contrato de endpoints

| Endpoint | Acceso | Resultado |
|---|---|---|
| POST /api/auth/register | Público | 201: crea Identity y perfil en una transacción; no emite JWT |
| POST /api/auth/login | Público | 200: token, role, expiresAt (UTC), usuarioId |
| POST /api/auth/initial-password | Invitación válida | Define primera contraseña y devuelve JWT |
| GET /api/auth/test-protegido | JWT | 200 autorizado, 401 sin token válido |
| POST /api/usuarios | Administrador | Crea sin contraseña; devuelve invitationToken y requiresPasswordSetup |
| POST /api/usuarios/{id}/invitation | Administrador | Renueva invitación e invalida la anterior |
| PATCH /api/usuarios/{id}/active | Administrador | Activa/desactiva con { "isActive": false } |

Todos los endpoints nuevos quedan protegidos por defecto salvo los marcados AllowAnonymous.
Las invitaciones duran 24 horas y se consumen al definir la contraseña.
El endpoint administrativo devuelve la invitación solo al administrador autenticado para su entrega al usuario.
No se implementó envío de correo. No registrar invitaciones en logs ni compartirlas públicamente.

**Registro:**

```json
{
  "nombre": "Ana",
  "apellido": "Perez",
  "email": "ana@ejemplo.com",
  "tipoDocumento": "DNI",
  "nroDocumento": "12345678",
  "password": "EjemploSeguro123!"
}
```

**Login:** { "email": "ana@ejemplo.com", "password": "EjemploSeguro123!" }.
Respuesta: { "token": "...", "role": "Usuario", "expiresAt": "...", "usuarioId": 1 }.
En Swagger, pegar solo el token en Authorize. En otras herramientas:
Authorization: Bearer <token>.

Usuario inexistente, password incorrecta, cuenta bloqueada o sin contraseña:
401 con code INVALID_CREDENTIALS y el mismo mensaje genérico.
Usuario desactivado con contraseña correcta: 403 con code USER_INACTIVE y mensaje claro.
La API no revela el estado de una cuenta antes de validar sus credenciales.
Cinco fallos de contraseña bloquean temporalmente el login por 15 minutos.
Los endpoints Auth tienen límite de 20 solicitudes por IP por minuto (429 al excederlo).

**Alta administrativa y primer acceso:**

1. El administrador envía el mismo perfil del registro, sin password, a POST /api/usuarios.
2. Entrega al usuario el email y invitationToken devueltos. No se genera un JWT en este paso.
3. React deberá abrir la pantalla de primera contraseña a partir de esa invitación.
   El login ordinario sin contraseña nunca concede acceso ni entrega invitaciones.
4. El usuario envía a POST /api/auth/initial-password:

```json
{
  "email": "ana@ejemplo.com",
  "invitationToken": "INVITACION_RECIBIDA",
  "password": "MiNuevaPassword123!",
  "confirmPassword": "MiNuevaPassword123!"
}
```

5. Solo tras guardar el hash se devuelve el JWT y puede abrirse el dashboard.
   Una invitación inválida, vencida o ya usada devuelve 400. No permite reemplazar una contraseña existente.
6. Para reenviar una invitación vencida, usar el endpoint administrativo de renovación.

La desactivación se comprueba contra la base en cada petición protegida.
El cambio de estado también rota el security stamp, por lo que tokens previos no vuelven a servir al reactivar.
No hay refresh tokens; al vencer el JWT se debe iniciar sesión nuevamente.

### Verificación

```powershell
dotnet build
dotnet run --project Tests/AuthenticationChecks/AuthenticationChecks.csproj
```

El ejecutable de verificación usa Identity real y un almacén en memoria exclusivamente para pruebas:
hash, contraseña correcta/incorrecta, invitación adulterada, ajena, vencida, revocada y reutilizada,
y JWT con identidad/rol, firma, emisor, audiencia y vencimiento.
No reemplaza una prueba de integración con SQL Server.

Prueba manual con SQL Server: registrar un usuario, iniciar sesión, probar test-protegido con/sin JWT;
crear un invitado desde un administrador, comprobar que no inicia sesión antes de definir password,
consumir la invitación, rechazar su reutilización, desactivar el usuario y comprobar que su JWT
anterior devuelve 401 y su login correcto devuelve 403.
Verificar que el registro duplicado no deja un AspNetUser huérfano y que las contraseñas
aparecen solo como PasswordHash en AspNetUsers.

Referencia: https://learn.microsoft.com/aspnet/core/security/authentication/customize-identity-model?view=aspnetcore-10.0
