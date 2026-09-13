# DigitalArs — Login, registro y primer administrador

Entrega para copiar y pegar. Los cambios están separados en `frontend/` y `api/`.
Se prepararon sobre el frontend del repositorio y la API de `C:\Users\lobma\Desktop\DigitalArs.Api`.
Esta entrega no reemplazó los archivos de esas carpetas.

## 1. Copiar los archivos

Detené las aplicaciones antes de reemplazar archivos.

- Copiá el contenido de `frontend/` en `C:\Users\lobma\Documents\alkemy-beta-squad\frontend\DigitalArs`.
- Copiá el contenido de `api/` en `C:\Users\lobma\Desktop\DigitalArs.Api`.
- Reemplazá los archivos coincidentes y creá los nuevos. No borres las demás carpetas.

El paquete contiene solo archivos nuevos o modificados. No contiene node_modules, bin, obj, conexiones ni claves.
No necesitás cambiar los paquetes NuGet ni agregar dependencias de React.
Los cambios de la API deben incorporarse también a la copia de backend que versionen en Git;
la copia del Escritorio no se sube al repositorio por sí sola.

### Archivos de la API

Reemplazar:
- Program.cs
- Controllers/AuthController.cs
- Services/AccountService.cs

Crear:
- Controllers/SetupController.cs
- DTOs/SetupAdminDto.cs
- FRONTEND-AUTH.md (documentación)

No reemplazar appsettings, la configuración JWT, la conexión ni los contextos de base existentes.

## 2. Preparar la API

Si Identity ya funciona, no es necesario volver a crear sus tablas. Estos cambios no agregan tablas.
Si es una instalación nueva, primero corré los scripts de database/ como indica el README de la raíz.

El administrador ya viene creado por database/Seed(v.003).sql:

| Correo | Contraseña |
|---|---|
| `admin@digitalars.com` | `Admin123!` |

React no tiene formulario de primer administrador: al arrancar consulta GET /api/setup/status y,
si la instalación está completa, muestra el login directamente.

Crear usuarios por el registro normal nunca asigna el rol Administrador.
Si el usuario que creaste antes tiene rol Usuario, no se convierte automáticamente en administrador.

## 3. Preparar React

En la carpeta del frontend:

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Abrí http://localhost:5173.

El archivo .env.local contiene:

```text
VITE_API_URL=https://localhost:7201
```

Es la dirección base, sin /api al final. Reiniciá Vite si la cambiás.
El puerto 5173 está fijado: si está ocupado, cerrá la otra instancia o coordiná otro puerto con la configuración CORS.

El certificado HTTPS de desarrollo debe estar aprobado en tu equipo.
Si aún no lo está, ejecutá `dotnet dev-certs https --trust` desde tu terminal.

### CORS

En Development, la API permite http://localhost:5173.
Si usás otro origen, configurá en la API (y reiniciala):

```powershell
dotnet user-secrets set "Cors:AllowedOrigins:0" "http://localhost:5174"
```

En producción, configurá Cors__AllowedOrigins__0 con el origen HTTPS real del frontend.
El frontend desplegado necesita VITE_API_URL con una API accesible por HTTPS; localhost solo sirve en tu máquina.
Vercel no publica automáticamente esta API .NET. Esta entrega no realizó ningún despliegue.

## 4. Flujo de la aplicación

1. Al abrir la aplicación, consulta GET /api/setup/status.
2. Si no hay administrador, informa que la instalación no está completa: falta correr database/Seed(v.003).sql.
3. Login válido: guarda la sesión en sessionStorage y abre /dashboard.
4. El administrador puede entrar a /usuarios/nuevo, registrar un usuario sin contraseña y obtener su invitación.
5. El usuario entra a /primera-password con correo y código, elige contraseña y recibe acceso.
6. También está disponible /register para el registro público de usuarios comunes.
7. Cerrar sesión elimina el token. La sesión se conserva al recargar la pestaña y se verifica con GET /api/auth/me.
8. Al vencer el JWT o recibir 401 en una llamada protegida, se cierra la sesión. Un usuario desactivado recibe el mensaje de la API.

El código de invitación se muestra al administrador pero no se guarda en sessionStorage.
No hay envío automático de correo. El administrador debe entregarlo por un medio privado.
La pantalla de dashboard es el punto de entrada; no inventa saldos, movimientos ni datos financieros.

## 5. Contextos globales

- ElementosGlobales: tema visual.
- AuthProvider / AuthContext: sesión, estado inicial, login, registro, primer administrador, primera contraseña y alta de usuarios.
- context/api.js: cliente HTTP usado por AuthProvider.

Los componentes no llaman fetch. Usan useAuth():

```jsx
const { login, register, createUser, logout, session } = useAuth()
```

Las validaciones de rol del frontend sirven para la navegación; la API sigue validando permisos.
sessionStorage guarda el token por pestaña, nunca contraseñas ni la clave de configuración inicial.
Esta persistencia implica que el token es accesible a JavaScript; evitá introducir HTML sin sanitizar.

## 6. Verificación

Frontend:

```powershell
npm run build
npm run lint
npm test
```

API:

```powershell
dotnet build
dotnet run --project Tests/AuthenticationChecks/AuthenticationChecks.csproj
```

Verificado en esta entrega:
- Compilación de frontend y API.
- ESLint sin errores.
- Ocho pruebas del cliente HTTP.
- Diecinueve verificaciones existentes de Identity/JWT.
- Navegador con servidor simulado: formulario inicial, contraseñas distintas, login incorrecto y correcto,
  dashboard de administrador, restauración al recargar, alta con invitación, cierre de sesión y primera contraseña.

La prueba de navegador usa respuestas simuladas y datos ficticios: no valida la integración con tu SQL Server.
Todavía debe probarse contra tu API real el alta inicial (incluidos dos intentos simultáneos),
el bloqueo de un segundo administrador, CORS, registro, login y alta de usuarios.
La sesión de herramientas no dispone de la autenticación Windows necesaria para comprobar tu base.