# DigitalArs — Frontend

Cliente React de la API DigitalArs: login, registro, primera contraseña con invitación,
dashboard y alta de usuarios. Hecho con Vite, React 19 y Material UI.

El backend está en `backend/DigitalArs.Api` y tiene su propio README; su solución para Visual
Studio es `backend/DigitalArs.Api.slnx`. Este frontend **no funciona solo**: necesita la API
levantada.

## Requisitos

- Node.js 24 (incluye npm).
- Visual Studio Code: es con lo que el equipo levanta el frontend.
- La API corriendo en `https://localhost:7201`, con SQL Server preparado según el README de la raíz.

## Puesta en marcha

Abrir **esta carpeta** en Visual Studio Code (no la raíz del repositorio: los scripts de npm se
resuelven contra el `package.json` de acá) y, desde la terminal integrada (**Ctrl+Ñ**):

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Abrir http://localhost:5173.

`.env.local` define la dirección base de la API, **sin `/api` al final**:

```text
VITE_API_URL=https://localhost:7201
```

Vite no recarga ese archivo en caliente: si lo cambiás, reiniciá `npm run dev`.

El puerto 5173 está fijado con `strictPort`, así que si está ocupado el arranque falla en vez
de saltar a otro puerto. Es a propósito: la política CORS de la API permite ese origen.

El certificado HTTPS de desarrollo tiene que estar aprobado en tu equipo, o las llamadas a la
API fallan desde el navegador. Si falta:

```powershell
dotnet dev-certs https --trust
```

### Si usás otro origen

Hay que habilitarlo también en la API, y reiniciarla:

```powershell
dotnet user-secrets set "Cors:AllowedOrigins:0" "http://localhost:5174"
```

En producción se configura `Cors__AllowedOrigins__0` con el origen HTTPS real.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 5173. |
| `npm run build` | Compila a `dist/`. |
| `npm run preview` | Sirve lo compilado, para revisar el build. |
| `npm run lint` | ESLint sobre todo el proyecto. |
| `npm test` | Ocho pruebas del cliente HTTP (`node --test`). |

## Estructura

```
src/
├─ main.jsx                        monta BrowserRouter y los dos providers
├─ App.jsx                         tema MUI, Header, Main, Footer
├─ components/
│  ├─ Main/Main.jsx                las rutas y la protección de navegación
│  ├─ Auth/AuthForm.jsx            formulario común: campos, carga y errores
│  ├─ Header/Header.jsx            envuelve a ResponsiveAppBar
│  ├─ Header/ResponsiveAppBar.jsx  navegación y cierre de sesión
│  ├─ Header/ChangeTheme.jsx       alterna claro/oscuro
│  ├─ Footer/Footer.jsx            pie de página
│  └─ Home/ScrollTopButton.jsx     botón de volver arriba
├─ context/
│  ├─ ElementosGlobales.jsx        tema claro/oscuro y tema MUI
│  ├─ AuthProvider.jsx             sesión y operaciones de autenticación
│  ├─ authContext.js               AuthContext y el hook useAuth
│  └─ api.js                       cliente HTTP (Axios) y traducción de errores
└─ routes/
   ├─ AuthPages.jsx                LoginPage, RegisterPage, InitialPasswordPage
   └─ Dashboard.jsx                Dashboard y NewUserPage
```

## Rutas

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/` | — | Redirige a `/dashboard` con sesión, o a `/login` sin ella. |
| `/login` | Público | Inicio de sesión. |
| `/register` | Público | Registro de un usuario común. |
| `/primera-password` | Con invitación | Definir la primera contraseña. |
| `/dashboard` | Autenticado | Punto de entrada tras iniciar sesión; muestra una vista por rol. |
| `/perfil` | Autenticado | Datos personales; el alias solo aparece si hay billetera. |
| `/movimientos` | Usuario | Historial de la billetera. El administrador no tiene una. |
| `/usuarios/nuevo` | Administrador | Alta de usuario, devuelve la invitación. |
| `/admin/usuarios` | Administrador | Listado, edición y activación de usuarios. |
| `/setup` | — | Redirige a `/login`; quedó por compatibilidad. |
| cualquier otra | — | Redirige a `/`. |

La protección de rutas organiza la navegación. **La autorización real la hace la API**: un
usuario sin rol Administrador que llegue a `/usuarios/nuevo` igual recibe 403 del backend.

Cada ruta declara el rol que pide con `<Protected rol={...}>` en `Main.jsx`. Quien no lo tiene
vuelve a `/dashboard`. El rol se lee siempre con `src/routes/rolesUtils.js`: es el único lugar
que sabe cómo viene en la sesión, así que ningún componente lo compara a mano.

## Cómo funciona la sesión

`AuthProvider` es el único que habla con la API. Al arrancar:

1. Consulta `GET /api/setup/status`. Si responde `requiresSetup: true`, muestra que la
   instalación no está completa: falta correr `database/Seed(v.003).sql`.
2. Si hay una sesión guardada, la verifica con `GET /api/auth/me`. Si da 401, la descarta.
3. Ante un fallo de conexión muestra el error con un botón de reintentar.

La sesión vive en `sessionStorage`, bajo la clave `digitalars.session`, con el token, su
vencimiento y el perfil. Es por pestaña y no guarda contraseñas ni invitaciones. Un temporizador
cierra la sesión cuando el token vence, y un 401 en cualquier llamada protegida también.

Cerrar sesión borra la copia local. **No hay revocación del JWT en el servidor por parte del
frontend**: una copia del token seguiría sirviendo hasta que venza o cambie el security stamp,
cosa que la API hace al desactivar un usuario.

Como el token es accesible desde JavaScript, no introducir HTML sin sanitizar.

### useAuth()

Los componentes no llaman a la API directamente: usan el hook.

```jsx
const { session, ready, connectionError, login, register, initialPassword, createUser, logout, retry } = useAuth()
```

| Qué | Para qué |
|---|---|
| `session` | `{ token, expiresAt, user }`, o `null`. `user.role` decide la navegación por rol. |
| `ready` | La verificación inicial terminó. |
| `connectionError` | Mensaje a mostrar cuando la API no responde o la instalación está incompleta. |
| `login` / `register` / `initialPassword` | Las tres operaciones públicas. |
| `createUser` | Alta administrativa; devuelve la invitación. |
| `logout` / `retry` | Cerrar sesión y reintentar la carga inicial. |

## Endpoints que consume

`POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/initial-password`,
`GET /api/auth/me`, `GET /api/setup/status`, `POST /api/usuarios`,
`GET /api/cuentas/me` y `POST /api/movimientos/depositos`.

El catálogo `GET /api/tiposdemovimientos` existe en la API pero todavía no se usa acá.

## El cliente HTTP

`context/api.js` expone `apiRequest(path, { method, body, token, signal })` sobre una instancia
de Axios. Se encarga de tres cosas que conviene no repetir en cada pantalla:

- Arma el header `Authorization: Bearer <token>` cuando se le pasa un token.
- Normaliza un 204 sin cuerpo a `null`.
- Traduce el error HTTP a un `Error` con `message`, `status` y `code`, usando el `message` que
  manda la API cuando existe. El 429 tiene su propio texto porque llega sin cuerpo JSON, y una
  cancelación conserva el nombre `AbortError` para poder distinguirla.

## Flujo para probar de punta a punta

1. Entrar con `admin@digitalars.com` / `Admin123!` (lo siembra `database/Seed(v.003).sql`).
2. Ir a **Registrar usuario**, completar un perfil y copiar la invitación.
3. Cerrar sesión o abrir una ventana privada.
4. Entrar a **Tengo una invitación**, poner el correo y el código, y elegir una contraseña.
5. Comprobar que el usuario nuevo entra al dashboard con rol `Usuario`.

El código de invitación se le muestra al administrador pero no se guarda en `sessionStorage`.
No hay envío de correo: hay que entregarlo por un medio privado.

## Verificación

```powershell
npm run build
npm run lint
npm test
```

Las ocho pruebas de `tests/api.test.mjs` cubren el cliente HTTP: headers, JSON, 204 sin cuerpo,
429, fallo de red, cancelación y los mensajes de error. **Usan respuestas simuladas**, así que
no validan la integración con la API real ni con SQL Server: para eso está el flujo manual de
arriba.

## Pendientes conocidos

- El dashboard muestra el saldo, el alias y el CVU de la cuenta propia, y permite ingresar
  dinero. Todavía no lista los movimientos: la API no expone ese endpoint.
- No hay listado de usuarios ni interfaz para renovar invitaciones o desactivar cuentas, aunque
  la API sí tiene esos endpoints.
- `src/routes/Home.jsx` y `src/routes/ProductId.jsx` quedaron del template original: ninguna
  ruta los importa.
- `package.json` todavía se llama `reactcommerce`, también del template.
- `vercel.json` configura solo este frontend. **No despliega la API .NET**, que necesita su
  propio hosting.
