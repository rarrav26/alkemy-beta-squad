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

1. `database/Init(v.001).sql`
2. `database/Create(v.002).sql`

**Esto es para una base nueva.** El script `Create` elimina y recrea tablas; no ejecutarlo sobre una base con datos que quieran conservar.

Opcionalmente, ejecutar `database/Seed(v.002).sql` una sola vez para cargar a Juan, María y Carlos con sus cuentas de ejemplo. Esos usuarios no tienen acceso al login.

Abrir la solución de la API en Visual Studio, dentro de:

```text
backend/DigitlaArs.Api
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

## 4. Configurar el primer administrador

En Visual Studio:

1. Clic derecho sobre el proyecto de la API.
2. Seleccionar **Administrar secretos de usuario**.
3. Agregar esta configuración, completando los campos vacíos:

```json
{
  "BootstrapAdmin": {
    "Nombre": "Administrador",
    "Apellido": "Inicial",
    "Email": "",
    "TipoDocumento": "DNI",
    "NroDocumento": "",
    "Password": ""
  }
}
```

La contraseña debe tener entre 8 y 128 caracteres, con mayúscula, minúscula, número y símbolo. Usar un correo y documento que no estén registrados.

Si el archivo ya tiene otras configuraciones, conservarlas y agregar `BootstrapAdmin` dentro del mismo objeto JSON.

**Estos secretos no se suben a Git.** Cada compañero puede elegir sus credenciales si usa su propia base. Si comparten una base que ya tiene administrador, este paso no es necesario.

## 5 Iniciar la API

La primera vez hay que preparar Identity y crear al administrador. Desde `backend/DigitlaArs.Api`:

```powershell
dotnet run --init-identity
dotnet run --bootstrap-admin
```

- `--init-identity` crea las tablas de Identity y los roles `Usuario` y `Administrador`.
- `--bootstrap-admin` crea al administrador con los secretos del paso anterior. Falla si ya existe uno.

Ambos comandos terminan solos: no levantan la API.

Después, seleccionar el perfil **https** en Visual Studio y ejecutar con **F5** o **Ctrl+F5**.
En cada arranque la API verifica la conexión a SQL Server y asegura que existan los roles.

> La clave JWT se configura en `Jwt:Key` (secretos de usuario o variables de entorno) y debe
> tener al menos 32 bytes. La API no arranca si falta.

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

1. Iniciar sesión con el administrador configurado.
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

No hay que repetir los scripts SQL, `--init-identity`, `--bootstrap-admin` ni configurar nuevamente los secretos: los datos existentes se conservan.

## Problemas frecuentes

- **No conecta con SQL:** revisar la instancia, el servicio y la cadena de conexión.
- **Falta BootstrapAdmin:** completar los secretos y reiniciar la API.
- **Registro devuelve 400:** revisar el mensaje; el email y el documento no pueden repetirse.
- **Frontend no conecta:** verificar que Swagger abra, que el certificado sea válido y que `.env.local` tenga la dirección correcta. Reiniciar React si cambiaron ese archivo.
- **Puerto 5173 ocupado:** cerrar la otra instancia del frontend.
