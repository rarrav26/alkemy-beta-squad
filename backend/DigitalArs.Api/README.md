# DigitalArs.Api

API REST en ASP.NET Core 10 + EF Core 10 (Database First) sobre SQL Server.

## Requisitos

- .NET SDK 10
- SQL Server con la base `DigitalArs` ya creada
- Herramienta EF Core CLI (solo si vas a re-generar entidades):

```powershell
dotnet tool install --global dotnet-ef
```

## Dónde está la solución

El archivo de solución vive un nivel más arriba, en `backend/DigitalArs.Api.slnx`, y apunta a
este proyecto. Se abre con **Archivo → Abrir → Proyecto o solución**.

**No abras la carpeta con "Abrir carpeta".** En modo carpeta Visual Studio trabaja como
*workspace*: no carga el proyecto .NET, no muestra el desplegable de perfiles y no lee
`Properties/launchSettings.json`. Sin ese archivo no hay `ConnectionStrings__DefaultConnection`
ni `ASPNETCORE_ENVIRONMENT`, así que la API arranca como `Production`, sin cadena de conexión, y
corta en el primer chequeo de `Program.cs`.

## Setup local (hacelo una sola vez al clonar)

**1. Abrí `backend/DigitalArs.Api.slnx` en Visual Studio** (no la carpeta, ver arriba).

**2. Copiá la plantilla de configuración:**

```powershell
Copy-Item Properties/launchSettings.Example.json Properties/launchSettings.json
```

**3. Abrí `Properties/launchSettings.json` y ajustá `ConnectionStrings__DefaultConnection`
a tu instancia de SQL Server.** Según cómo tengas instalado el motor, el `Server=` cambia:

| Tu instalación                        | Valor de `Server=`               |
| ------------------------------------- | -------------------------------- |
| SQL Server Express (lo más común acá) | `.\SQLEXPRESS01` — es el default |
| SQL Server, instancia por defecto     | `localhost`                      |
| Docker / puerto explícito             | `localhost,1433`                 |

> En JSON la barra invertida se escribe doble: `Server=.\\SQLEXPRESS01`. En PowerShell,
> con comillas simples, va simple: `Server=.\SQLEXPRESS01`.

Este archivo **no se versiona** (está en `.gitignore`).

**4. Levantá la API:** en el desplegable que está al lado del botón verde de ejecutar, elegí el
perfil **DigitalArs.Api**, y después F5. También podés levantarla desde esta carpeta:

```powershell
dotnet run --launch-profile DigitalArs.Api
```

**5. Swagger:** https://localhost:7201/swagger

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
  Tampoco llevan la clave `DefaultConnection` vacía: si estuviera, `GetConnectionString`
  devolvería cadena vacía en vez de `null`, y al depurar parecería que la configuración llegó
  vacía cuando en realidad el perfil nunca se aplicó. Sin la clave, el `null` lo dice de una.
- Si necesitás correr un comando de `dotnet` sin perfil de arranque, exportá la variable a mano:

```powershell
$env:ConnectionStrings__DefaultConnection='Server=.\SQLEXPRESS01;Database=DigitalArs;Trusted_Connection=True;TrustServerCertificate=True;'
```

## Scaffolding Database First

El modelo de datos se genera **desde la base** (Database First), no con migraciones. Desde la
carpeta `backend/DigitalArs.Api`, con la variable de entorno exportada como se muestra arriba:

```powershell
dotnet ef dbcontext scaffold "$env:ConnectionStrings__DefaultConnection" Microsoft.EntityFrameworkCore.SqlServer --project "DigitalArs.Api.csproj" --startup-project "DigitalArs.Api.csproj" --context DigitalArsDbContext --context-dir Data/Context --output-dir Data/Entities --namespace DigitalArs.Api.Data.Entities --context-namespace DigitalArs.Api.Data.Context --no-onconfiguring --use-database-names --force
```

`--no-onconfiguring` es importante: evita que el scaffolding escriba la cadena de conexión
hardcodeada dentro del `DbContext`.

## Estructura

```
Controllers/      endpoints HTTP: reciben el request y traducen el resultado a un status
DTOs/             lo que cada operación acepta y devuelve; nunca se expone una entidad
Interfaces/       contratos, tanto de repositorios como de servicios
Services/         las reglas de negocio (login, alta, invitaciones, JWT, cuenta, depósito,
                  historial y transferencia)
Repositories/     acceso a datos vía DbContext
Helpers/          lo compartido que no depende de una petición HTTP:
  Domain/           reglas de negocio puras: importes, alias/CVU, signos, roles
  Common/           utilidades técnicas: fechas, normalización de texto, mensajes de Identity
  Results/          Resultado<T> y MotivoDeRechazo: el contrato servicio → controller
  Configuration/    opciones y constantes de configuración: JWT e invitación
Errors/           la capa de errores, junta en un solo lugar: ErrorResponse (la forma),
                  RespuestaDeError (la arma desde un Resultado) y GlobalExceptionHandler
                  (convierte una excepción no controlada en un 500 con esa misma forma)
OpenApi/          documentación del esquema Bearer en Swagger
Data/Context/     DigitalArsDbContext (generado por scaffolding) y AuthDbContext (Identity)
Data/Entities/    entidades (generadas por scaffolding)
```

### Cada carpeta contiene una sola clase de archivo

Esta regla es la que mantiene el proyecto navegable, y ya se rompió una vez: `Services/`
llegó a tener 19 archivos de los cuales solo 7 eran servicios.

- En `Services/` va **solo una clase que se registra en `Program.cs`** y recibe sus
  dependencias por constructor. Si la clase es `static`, si no tiene dependencias, o si
  no se registra en el contenedor, **no es un servicio**: va en `Helpers/`.
- En `Controllers/` va **solo un `<Recurso>Controller`**. Un helper compartido entre
  controllers no va ahí.
- Antes de crear un archivo nuevo, preguntate **qué es**, no quién lo usa. Una regla de
  negocio pura que usan un DTO y un repositorio va en `Helpers/Domain/`, aunque el
  servicio también la use.

Por qué importa: cuando una regla pura vive en `Services/`, un repositorio que la necesita
termina haciendo `using ...Services`, y **la capa de datos pasa a depender de la de
negocio**, al revés del flujo que describe la sección de abajo.

Flujo de una lectura simple: `Controller` → `Interface` → `Repository` → `DbContext`.
Flujo cuando hay reglas de por medio: `Controller` → `Interface` → `Service` → `Repository` / `UserManager`.

El corte importante es que **un controlador no conoce entidades, ni `DbContext`, ni `UserManager`**.
El servicio aplica las reglas y devuelve un `Resultado<T>` con la respuesta lista o con un
`MotivoDeRechazo`; el controlador traduce ese motivo al status y al mensaje del endpoint.

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

Las tablas de Identity, los roles y el administrador inicial se preparan con los scripts de
la carpeta database/ antes de levantar la API. Ver el README de la raíz del repositorio.

1. Configurá una clave aleatoria local (una sola vez; no subirla al repositorio):

```powershell
$keyBytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($keyBytes)
dotnet user-secrets set "Jwt:Key" ([Convert]::ToBase64String($keyBytes))
dotnet build
dotnet run --no-build --launch-profile DigitalArs.Api
```

database/Identity(v.001).sql agrega las siete tablas Identity si no existen.
Si encuentra parte de las tablas Identity, se detiene para evitar completar un esquema incompatible.
Si ya están las siete, las conserva; se espera el modelo estándar de Identity de .NET 10.
El script no borra ni altera las tablas de negocio.

Swagger: https://localhost:7201/swagger (perfil DigitalArs.Api, el único que define launchSettings.json).
Si pasás un nombre de perfil que no existe, `dotnet run` avisa pero arranca igual sin las variables
de entorno del perfil, y la API falla diciendo que falta la cadena de conexión aunque esté configurada.
Visual Studio hace lo mismo en silencio: guarda el perfil elegido en `DigitalArs.Api.csproj.user`
(archivo local, no versionado), y si ahí quedó uno viejo como `http` o `https` —que ya no existen en
`launchSettings.json`— ejecuta sin perfil y ves el mismo error. Se arregla eligiendo **DigitalArs.Api**
en el desplegable.
Configurá el certificado de desarrollo con dotnet dev-certs https --trust si tu equipo todavía no confía en él.
En producción, suministrá Jwt__Key desde un gestor de secretos y conservá las claves de Data Protection
de forma persistente y compartida entre instancias: las invitaciones dependen de ellas.

### Primer administrador

El registro público siempre asigna Usuario. Nunca acepta un rol proporcionado por el cliente.
La API no tiene ningún camino para crear un Administrador: el único es database/Seed(v.003).sql,
que siembra admin@digitalars.com con la contraseña Admin123!.

Identity guarda la contraseña con PBKDF2 y salt aleatorio, que no se puede calcular en T-SQL,
así que el seed lleva el hash ya generado. Para cambiar esa contraseña hay que regenerarlo con
PasswordHasher y reemplazar el literal @AdminHash del script.

Son credenciales de proyecto de estudio. En un despliegue real el administrador se siembra con
una contraseña propia y se rota apenas se entra por primera vez.
La contraseña debe tener al menos ocho caracteres, mayúscula, minúscula, número y símbolo (máximo 128).

### Contrato de endpoints

| Endpoint | Acceso | Resultado |
|---|---|---|
| POST /api/auth/register | Público | 201: crea Identity y perfil en una transacción; no emite JWT |
| POST /api/auth/login | Público | 200: token, role, expiresAt (UTC), usuarioId |
| POST /api/auth/initial-password | Invitación válida | Define primera contraseña y devuelve JWT |
| GET /api/auth/me | JWT | 200: perfil y rol consultados en la base, no en el token |
| GET /api/auth/test-protegido | JWT | 200 autorizado, 401 sin token válido |
| GET /api/usuarios | Administrador | 200: listado paginado de usuarios regulares, con ?page, ?pageSize y ?busqueda |
| GET /api/usuarios/{id} | Administrador | 200: detalle del usuario, o 404 si no existe |
| PATCH /api/usuarios/{id} | Administrador | 200: edita nombre, apellido y email; no toca documento ni saldo |
| POST /api/usuarios | Administrador | 201: crea sin contraseña; devuelve usuarioId, invitationToken, requiresPasswordSetup y expiresInSeconds |
| POST /api/usuarios/{id}/invitation | Administrador | Renueva invitación e invalida la anterior |
| PATCH /api/usuarios/{id}/active | Administrador | 204 sin cuerpo: activa/desactiva con { "isActive": false }; 404 si no existe |
| GET /api/tiposdemovimientos | JWT | 200: catálogo completo de tipos de movimiento |
| GET /api/tiposdemovimientos/{id} | JWT | 200: un tipo, o 404 si no existe |
| GET /api/usuarios/me | JWT | 200: perfil propio con su cuenta, si tiene |
| PATCH /api/usuarios/me | JWT | 200: edita nombre, apellido y email propios; si cambia el email pide `currentPassword` |
| GET /api/cuentas/me | JWT | 200: id, alias, CVU y saldo de la cuenta propia; 404 si no tiene |
| PATCH /api/cuentas/me/alias | JWT | 200: cambia el alias propio con { "alias": "mariagonzalez" } (solo letras, 3 a 50; el formato con puntos es solo el autogenerado); 400 si el formato no sirve; 409 si ya existe |
| POST /api/movimientos/depositos | JWT | 200: acredita { "importe": 500 } y devuelve el saldo actualizado y la fecha en hora argentina |
| GET /api/movimientos | JWT | 200: historial propio paginado, con filtros de fecha y tipo y búsqueda por nombre de tipo |
| POST /api/transferencias/resolver-destino | JWT | 200: valida { "destino", "importe" } y devuelve id, alias, CVU y titular del destino; `importe` es obligatorio y si no alcanza el saldo responde 409 |
| POST /api/transferencias | JWT | 200: transfiere a otra cuenta activa y devuelve saldoActual y message |
| GET /api/setup/status | Público | Informa si la instalación ya tiene administrador |

Un usuario sin rol Administrador que llame a un endpoint de Administrador recibe 403 sin cuerpo
JSON, que es la respuesta por defecto del framework. En `UsuariosController` el rol va en cada
acción, porque los endpoints `me` son de cualquier usuario logueado: un endpoint de
administración nuevo tiene que llevar su `[Authorize(Roles = RolPrincipal.Administrador)]`.

Los endpoints de billetera (cuenta, movimientos y transferencias) piden solo JWT, no el rol
Usuario. El administrador no tiene cuenta, así que si los llama recibe 404.

### GET /api/movimientos — historial paginado

Consulta la tabla `Movimientos` de la cuenta del usuario del token. El filtrado,
el conteo y la paginación los resuelve SQL Server (`WHERE` + `OFFSET/FETCH`):
nunca se traen todos los movimientos para recortarlos en memoria.

Todos los parámetros son opcionales y viajan por query string:

| Parámetro | Valores | Default |
| --- | --- | --- |
| page | entero >= 1 | 1 |
| pageSize | entero entre 1 y 50 | 5 |
| desde | yyyy-MM-dd (día incluido) | sin filtro |
| hasta | yyyy-MM-dd (día incluido) | sin filtro |
| tipo | credito, debito o todas | todas |
| busqueda | texto de hasta 100 caracteres | sin filtro |

El orden es fijo, `fecha DESC, id DESC`: los más recientes primero. El desempate
por id garantiza que una fila no aparezca en dos páginas distintas cuando dos
movimientos comparten la misma fecha. Sin ningún parámetro,
`GET /api/movimientos` devuelve los 5 movimientos más recientes.

`desde` y `hasta` son días de calendario argentinos y los dos se incluyen. Como
la columna `fecha` está en UTC, los límites se convierten antes de consultar: un
movimiento guardado a las `2026-09-15T01:00Z` es el 14 a las 22:00 en Argentina y
entra en `?hasta=2026-09-14`.

`signo` no es una columna de la base: se deriva del tipo
(`Helpers/Domain/SignoDeMovimiento.cs`). `DEPOSITO` y `TRANSFERENCIA_RECIBIDA` son
`CREDITO`, `TRANSFERENCIA_ENVIADA` es `DEBITO`. Por eso `?tipo=credito` se
traduce a un `IN` sobre los tipos que suman, y no a un filtro en memoria.

Hay un tercer valor, `DESCONOCIDO`: un tipo que está cargado en la base pero que
`SignoDeMovimiento` todavía no clasifica sale con ese signo, y el front lo muestra
sin signo en vez de romper el historial entero con un 500. Es un texto y no `null`
a propósito, así `signo` nunca falta en la respuesta. El movimiento se lista igual
en `?tipo=todas`, pero queda afuera de `?tipo=credito` y de `?tipo=debito`, porque
no se sabe para qué lado suma. Clasificarlo es agregar una línea al diccionario de
`Helpers/Domain/SignoDeMovimiento.cs`, nada más.

`busqueda` filtra por el **nombre del tipo de movimiento**, no por importe ni por
fecha: es el buscador de la pantalla de historial, y lo que compara es la
`descripcion` de `Tipo_Movimiento`. Ignora mayúsculas y acentos, así que `depósito`,
`deposito` y `DEPÓSITO` traen lo mismo. Normalizar los dos lados
(`Helpers/Common/TextoDeBusqueda.cs`) hace falta porque la collation de la base es
`Modern_Spanish_CI_AS`: ignora las mayúsculas pero **sí distingue los acentos**, y
sin eso el `depósito` que escribe el usuario no encontraría el `DEPOSITO` guardado.

El usuario también puede escribir con espacios lo que en la base va con guion bajo:
`transferencia enviada` encuentra `TRANSFERENCIA_ENVIADA`, porque el nombre se
compara como se lee en pantalla. Y alcanza con una parte del nombre:
`transferencia` trae la enviada y la recibida. Los tipos buscables salen del mismo
diccionario que el signo, así que un tipo que todavía sale con `DESCONOCIDO`
tampoco se encuentra escribiendo su nombre.

Un término que no coincide con ningún tipo devuelve una **página vacía**, no el
historial completo ni un error: no encontrar nada es un resultado válido, igual que
un rango de fechas sin movimientos. Esa diferencia vive en `FiltroDeMovimientos`,
donde la búsqueda en `null` significa "no buscó nada" y la lista vacía significa
"buscó algo que no existe", o sea cero resultados.

La búsqueda se combina con los demás filtros con AND, no los reemplaza:
`?tipo=credito&busqueda=transferencia` devuelve solo transferencias recibidas,
porque la enviada es un débito y queda afuera por el otro filtro.

La cuenta sale siempre del token, nunca de un parámetro: por eso un usuario no
puede pedir los movimientos de otra cuenta.

Respuesta 200:

```json
{
  "items": [
    { "id": 18, "fecha": "2026-09-14T10:05:22-03:00", "tipo": "DEPOSITO", "signo": "CREDITO", "importe": 1500.00 },
    { "id": 17, "fecha": "2026-09-13T18:41:07-03:00", "tipo": "TRANSFERENCIA_ENVIADA", "signo": "DEBITO", "importe": 320.50 }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 18,
  "totalPages": 4
}
```

`fecha` viaja en hora argentina con el huso incluido. Es la forma única de toda la
API: el depósito devuelve su `fecha` igual. En la base se guarda siempre UTC y la
conversión a -03:00 vive en un solo lugar (`Helpers/Common/HoraDeArgentina.cs`).

El front igual tiene que fijar el huso al formatear (`timeZone:
'America/Argentina/Buenos_Aires'`): `Intl.DateTimeFormat` usa el del navegador, y
sin eso un movimiento de las 22:00 se vería con la fecha del día siguiente desde
otro país.

Cuando no hay resultados devuelve `items: []` con `totalItems: 0` y
`totalPages: 0`, y el status sigue siendo **200**: no tener movimientos no es un
error. Se puede forzar ese caso con `?desde=2020-01-01&hasta=2020-01-02`.

Pedir una página que no existe (`?page=99`) también devuelve **200**, con
`items: []` y el `totalItems` real. No se corrige el `page` que mandó el front ni
se responde 404: el front se da cuenta solo comparando contra `totalPages`.

Errores: `400` si `page`/`pageSize` están fuera de rango, si `desde` es posterior
a `hasta`, si `tipo` no es uno de los tres valores aceptados o si `busqueda` pasa
los 100 caracteres; `401` sin token o
con token inválido; `403` si el usuario está desactivado; `404` si no tiene cuenta
asociada.

En la práctica un usuario desactivado ve un `401` y no el `403`: `Program.cs`
revalida `is_active` contra la base en cada request y descarta el token antes de
que llegue al servicio. La rama `403` queda como red de seguridad.

Todo error que trae cuerpo usa la misma forma, `ErrorResponse`: `{ "code", "message", "errors" }`,
donde `code` y `errors` se omiten cuando no aplican. Eso incluye los 400 de validación de
DTO, que salen con `code` VALIDATION_ERROR: `Program.cs` reemplaza el ValidationProblemDetails
que `[ApiController]` devolvería por su cuenta. Cuando el cuerpo no se puede deserializar
el mensaje es genérico a propósito, porque el texto del framework nombra los tipos internos.

### Códigos de error

El `code` tiene **dos formatos**, según quién arma el error. Hay que tenerlo en cuenta al
comparar en el front o en una prueba de Apidog.

Escritos a mano, en MAYÚSCULAS (Auth, Usuarios y el manejador global):

| code | Status | Cuándo |
|---|---|---|
| VALIDATION_ERROR | 400 | Cualquier DTO inválido, en cualquier endpoint |
| INVALID_CREDENTIALS | 401 | Login: email o contraseña incorrectos, o cuenta bloqueada |
| USER_INACTIVE | 403 | Login o primera contraseña de un usuario desactivado; `GET`/`PATCH /api/usuarios/me` y `PATCH /api/cuentas/me/alias` |
| PASSWORD_SETUP_REQUIRED | 409 | Login de una cuenta creada por el administrador que todavía no definió contraseña |
| INVALID_INVITATION | 400 | Primera contraseña con invitación inválida, vencida o ya usada |
| INTERNAL_ERROR | 500 | Cualquier excepción no controlada (`GlobalExceptionHandler`) |

Nombre del motivo, en PascalCase (Cuentas, Movimientos y Transferencias, vía
`RespuestaDeError.Desde`, que copia el nombre de `MotivoDeRechazo`):

| code | Status | Cuándo |
|---|---|---|
| MismaCuenta | 400 | Transferencia a la cuenta propia |
| UsuarioDesactivado | 400 | Transferencia a una cuenta cuyo titular está desactivado |
| UsuarioDesactivado | 403 | `GET /api/cuentas/me`, historial o depósito de un usuario desactivado (red de seguridad, ver arriba) |
| CuentaNoEncontrada | 404 | El usuario no tiene cuenta (por ejemplo, el administrador) |
| DestinoNoEncontrado | 404 | Ninguna cuenta con ese alias o CVU |
| SaldoInsuficiente | 409 | La transferencia o el `resolver-destino` superan el saldo |
| SaldoMaximoSuperado | 409 | El depósito deja la cuenta por encima del saldo máximo |
| NoSePudoActualizar | 409 | El depósito no se pudo acreditar |
| TipoMovimientoNoConfigurado | 500 | Falta el tipo DEPOSITO en la base |

Por eso un usuario desactivado puede llegar como `USER_INACTIVE` o como `UsuarioDesactivado`, y
el front acepta los dos.

Salen **sin `code`**, solo con `message` y a veces `errors`: los 400 del registro (email o
documento repetidos, contraseña rechazada por Identity) y del alta administrativa, los 400 de
`PATCH /api/usuarios/me` y `PATCH /api/usuarios/{id}`, los 404/409 de `PATCH /api/cuentas/me/alias`
y los 400/409 de invitación y estado en `UsuariosController`.

Salen **sin cuerpo**: el 401 de los endpoints protegidos (token ausente, inválido, vencido o de un
usuario desactivado; el único 401 con cuerpo es el `INVALID_CREDENTIALS` del login), el 403 por
falta de rol, el 429 del límite de solicitudes y los 404 de `UsuariosController` y de
`GET /api/tiposdemovimientos/{id}`.

### Ejemplos en Swagger

Cada cuerpo de request trae un ejemplo en Swagger (botón **Try it out**). Salen de los
comentarios `/// <example>` de las propiedades de cada DTO: `GenerateDocumentationFile` en el
`.csproj` hace que `Microsoft.AspNetCore.OpenApi` los publique. Un DTO nuevo tiene que llevar los
suyos, con valores que pasen su propia validación. Un ejemplo que parece número pero es texto
(un DNI) va entre comillas: `/// <example>"12345678"</example>`.

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

Usuario inexistente, password incorrecta o cuenta bloqueada:
401 con code INVALID_CREDENTIALS y el mismo mensaje genérico.
Cuenta creada por el administrador que todavía no definió contraseña:
409 con code PASSWORD_SETUP_REQUIRED, para que el frontend la derive a
/primera-password en lugar de mostrarle un error. Esa pantalla sigue exigiendo
el código de invitación, así que el 409 no alcanza para entrar.
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
dotnet run --project Tests/MovimientosChecks/MovimientosChecks.csproj
```

`AuthenticationChecks` (36 verificaciones) usa Identity real y un almacén en memoria exclusivamente para pruebas:
hash, contraseña correcta/incorrecta, invitación adulterada, ajena, vencida, revocada y reutilizada,
JWT con identidad/rol, firma, emisor, audiencia y vencimiento, y el largo mínimo del alias.
`MovimientosChecks` (15 verificaciones) prueba reglas puras, sin base: la normalización de la
búsqueda del historial y el signo de cada tipo de movimiento.
Ninguno reemplaza una prueba de integración con SQL Server.

La prueba de integración contra la API levantada y SQL Server es la colección de Apidog de
`docs/apidog/`: recorre registro, login, perfil, depósito, transferencia, historial y
administración con 55 aserciones. Ver `docs/apidog/README.md`.

Prueba manual con SQL Server: registrar un usuario, iniciar sesión, probar test-protegido con/sin JWT;
crear un invitado desde un administrador, comprobar que no inicia sesión antes de definir password,
consumir la invitación, rechazar su reutilización, desactivar el usuario y comprobar que su JWT
anterior devuelve 401 y su login correcto devuelve 403.
Verificar que el registro duplicado no deja un AspNetUser huérfano y que las contraseñas
aparecen solo como PasswordHash en AspNetUsers.

Referencia: https://learn.microsoft.com/aspnet/core/security/authentication/customize-identity-model?view=aspnetcore-10.0
