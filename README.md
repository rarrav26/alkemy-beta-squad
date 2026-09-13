# DigitalArs: cómo levantar el proyecto

## 1. Requisitos

Tener instalados:

- Git.
- .NET SDK 10 y Visual Studio compatible.
- SQL Server y SQL Server Management Studio.
- Node.js 24, que incluye npm.

Traigan los últimos cambios con `git pull`. Trabajen sobre la rama que indique el equipo.

## 2. Preparar la base de datos

En SQL Server Management Studio, conectarse a su instancia y ejecutar, en este orden:

1. `database/Init(v.001).sql` — crea la base.
2. `database/Create(v.002).sql` — tablas de negocio y catálogo de tipos de movimiento.
3. `database/Identity(v.001).sql` — las siete tablas de ASP.NET Core Identity.
4. `database/Seed(v.003).sql` — roles, administrador inicial y datos de ejemplo.

**Esto es para una base nueva.** El script `Create` elimina y recrea tablas; no ejecutarlo sobre una base con datos que quieran conservar. Los otros tres se pueden repetir sin romper nada: solo agregan lo que falta.

El seed deja creado al administrador con el que se entra por primera vez:

| Correo | Contraseña |
|---|---|
| `admin@digitalars.com` | `Admin123!` |

> Son credenciales de proyecto de estudio, versionadas a propósito para que cualquiera pueda levantar el entorno. No usarlas fuera de la máquina local.

El seed también carga a Juan, María y Carlos con sus cuentas de ejemplo. Esos usuarios sirven para probar consultas: no tienen acceso al login.

Abrir la solución de la API en Visual Studio, dentro de:

```text
backend/DigitalArs.Api
```

En `Properties/launchSettings.json`, buscar el perfil `DigitalArs.Api` y ajustar `ConnectionStrings__DefaultConnection` a su instancia de SQL Server.

Ejemplo con autenticación de Windows:

```json
"ConnectionStrings__DefaultConnection": "Server=.\\SQLEXPRESS;Database=DigitalArs;Trusted_Connection=True;TrustServerCertificate=True;"
```

Cambiar `.\\SQLEXPRESS` por el nombre de su servidor. Mantener:

```json
"ASPNETCORE_ENVIRONMENT": "Development"
```

## 4. Configurar la clave JWT

La API firma los tokens con `Jwt:Key` y no arranca si falta. En Visual Studio:

1. Clic derecho sobre el proyecto de la API.
2. Seleccionar **Administrar secretos de usuario**.
3. Agregar esta configuración, con una clave propia:

```json
{
  "Jwt": {
    "Key": ""
  }
}
```

La clave debe tener **al menos 32 caracteres**. Sirve cualquier texto largo al azar.

Si el archivo ya tiene otras configuraciones, conservarlas y agregar `Jwt` dentro del mismo objeto JSON.

**Estos secretos no se suben a Git.** Cada compañero usa la suya.

## 5 Iniciar la API

No hace falta ningún paso previo: la base ya quedó lista en el punto 2.

Seleccionar el perfil **https** en Visual Studio y ejecutar con **F5** o **Ctrl+F5**.
En cada arranque la API solo verifica que pueda conectarse a SQL Server.

Abrir:

**https://localhost:7201/swagger**

Si falta confiar en el certificado HTTPS de desarrollo, ejecutar una vez:

```powershell
dotnet dev-certs https --trust
```

## 6. Iniciar el frontend

Abrir una terminal en:

```text
frontend/DigitalArs
```

La primera vez:

```powershell
npm ci
```

Iniciar React:

```powershell
npm run dev
```

Abrir:

**http://localhost:5173**

Mantener la API y el frontend ejecutándose al mismo tiempo.

## 7. Probar el flujo

1. Iniciar sesión con `admin@digitalars.com` / `Admin123!`.
2. Comprobar que abre el dashboard.
3. Elegir **Registrar usuario**.
4. Completar datos distintos a los del administrador.
5. Copiar la invitación obtenida.
6. Cerrar sesión o abrir una ventana privada.
7. Entrar a **Tengo una invitación**, completar el correo y el código, y elegir una contraseña.
8. Comprobar que el nuevo usuario entra al dashboard con rol `Usuario`.

También pueden probar **Crear una cuenta**, que registra directamente un usuario común con contraseña.

Para comprobar JWT en Swagger: `GET /api/auth/test-protegido` debe devolver **401 sin token** y **200** después de iniciar sesión y pegar el token en **Authorize**.

## Las próximas veces

Solo necesitan:

1. Tener SQL Server iniciado.
2. Ejecutar la API desde Visual Studio.
3. Ejecutar `npm run dev` en el frontend.

No hay que repetir los scripts SQL ni configurar nuevamente los secretos: los datos existentes se conservan.

## Problemas frecuentes

- **No conecta con SQL:** revisar la instancia, el servicio y la cadena de conexión.
- **La API no arranca por `Jwt:Key`:** completar el secreto del punto 4 con al menos 32 caracteres.
- **El login del administrador falla:** verificar que se haya ejecutado `database/Seed(v.003).sql` después de `database/Identity(v.001).sql`.
- **Registro devuelve 400:** revisar el mensaje; el email y el documento no pueden repetirse.
- **Frontend no conecta:** verificar que Swagger abra, que el certificado sea válido y que `.env.local` tenga la dirección correcta. Reiniciar React si cambiaron ese archivo.
- **Puerto 5173 ocupado:** cerrar la otra instancia del frontend.
