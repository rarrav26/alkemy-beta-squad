# DigitalArs — Frontend

Cliente React de la API DigitalArs. Hecho con Vite, React 19 y Material UI.

- Acceso: login, registro y primera contraseña con invitación.
- Usuario regular: saldo, depósito, transferencia, historial de movimientos, perfil y alias.
- Administrador: alta de usuarios con invitación, y listado, edición y activación de usuarios.

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
| `npm test` | Las 25 pruebas de `tests/` (`node --test`). |

## Estructura

```
src/
├─ main.jsx                        monta BrowserRouter y los dos providers
├─ App.jsx                         tema MUI, Header, Main, Footer
├─ components/
│  ├─ Main/Main.jsx                las rutas y la protección de navegación
│  ├─ Auth/AuthForm.jsx            formulario común: campos, carga y errores
│  ├─ Admin/EditarUsuarioModal.jsx edición de un usuario por el administrador
│  ├─ Cuentas/DepositoModal.jsx    ingreso de dinero
│  ├─ Cuentas/TransferenciaModal.jsx  transferencia: resolver destino y confirmar
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
   ├─ Dashboard.jsx                Dashboard (saldo o panel admin) y NewUserPage
   ├─ Perfil.jsx                   datos personales y alias
   ├─ Movimientos.jsx              historial paginado con filtros
   ├─ UsuariosAdmin.jsx            listado, búsqueda y activación de usuarios
   ├─ rolesUtils.js                único lugar que lee el rol de la sesión
   └─ dashboardUtils.js, movimientosUtils.js, perfilUtils.js
                                   funciones puras de cada pantalla, probadas en tests/
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

`AuthProvider` concentra las llamadas a la API. Al arrancar:

1. Consulta `GET /api/setup/status`. Si responde `requiresSetup: true`, muestra que la
   instalación no está completa: falta correr `database/Seed(v.003).sql`.
2. Si hay una sesión guardada, la verifica con `GET /api/auth/me`. Si da 401, la descarta.
3. Ante un fallo de conexión muestra el error con un botón de reintentar.

Antes de dibujar cualquier ruta protegida, confirma con `GET /api/usuarios/me` que la sesión
sigue valiendo (`sesionVerificada`). Hasta que responde, no se muestra ni la pantalla ni la
navegación. Así, a un usuario desactivado con la sesión abierta se lo saca antes de que vea nada.

La sesión vive en `sessionStorage`, bajo la clave `digitalars.session`, con el token, su
vencimiento y el perfil. Es por pestaña y no guarda contraseñas ni invitaciones. Un temporizador
cierra la sesión cuando el token vence. También la cierra un 401, o un 403 `USER_INACTIVE`, en
cualquier llamada que pase por `authenticatedRequest`.

Cerrar sesión borra la copia local. **No hay revocación del JWT en el servidor por parte del
frontend**: una copia del token seguiría sirviendo hasta que venza o cambie el security stamp,
cosa que la API hace al desactivar un usuario.

Como el token es accesible desde JavaScript, no introducir HTML sin sanitizar.

### useAuth()

Los componentes llaman a la API a través del hook. La excepción es la gestión de usuarios del
administrador: `UsuariosAdmin.jsx` y `EditarUsuarioModal.jsx` usan funciones de `api.js` y les
pasan el token a mano. Por eso un 401 en esas pantallas muestra un error pero no cierra la sesión.

```jsx
const { session, ready, sesionVerificada, login, logout, obtenerMiCuenta, transferir } = useAuth()
```

| Qué | Para qué |
|---|---|
| `session` | `{ token, expiresAt, user }`, o `null`. `user.role` decide la navegación por rol. |
| `ready` | La verificación inicial terminó. |
| `sesionVerificada` | El servidor confirmó que el token de la sesión sigue valiendo. |
| `connectionError` | Mensaje a mostrar cuando la API no responde o la instalación está incompleta. |
| `motivoDeCierre` | Por qué se cerró la sesión sola (por ejemplo, usuario desactivado). |
| `login` / `register` / `initialPassword` | Las tres operaciones públicas. |
| `createUser` | Alta administrativa; devuelve la invitación. |
| `obtenerMiPerfil` / `actualizarMiPerfil` | Perfil propio. |
| `obtenerMiCuenta` / `actualizarAliasCuenta` | Cuenta propia y alias. |
| `ingresarDinero` | Depósito. |
| `resolverDestinoDeTransferencia` / `transferir` | Los dos pasos de la transferencia. |
| `obtenerMovimientos` | Historial paginado con filtros. |
| `verificarSesionActiva` | Revalida la sesión contra el servidor. |
| `logout` / `retry` | Cerrar sesión y reintentar la carga inicial. |

## Endpoints que consume

| Grupo | Endpoints |
|---|---|
| Acceso | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/initial-password`, `GET /api/auth/me`, `GET /api/setup/status` |
| Perfil y cuenta | `GET` y `PATCH /api/usuarios/me`, `GET /api/cuentas/me`, `PATCH /api/cuentas/me/alias` |
| Billetera | `POST /api/movimientos/depositos`, `GET /api/movimientos`, `POST /api/transferencias/resolver-destino`, `POST /api/transferencias` |
| Administrador | `GET /api/usuarios`, `POST /api/usuarios`, `PATCH /api/usuarios/{id}`, `PATCH /api/usuarios/{id}/active` |

Existen en la API pero todavía no se usan acá: `GET /api/tiposdemovimientos`,
`GET /api/usuarios/{id}` y `POST /api/usuarios/{id}/invitation`.

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

Son 25 pruebas en 4 archivos:

| Archivo | Pruebas | Qué cubre |
|---|---|---|
| `tests/api.test.mjs` | 8 | Cliente HTTP: headers, JSON, 204 sin cuerpo, 429, fallo de red, cancelación y mensajes de error. |
| `tests/roles.test.mjs` | 5 | Qué rutas ve cada rol. |
| `tests/dashboard.test.mjs` | 3 | Usuario de la sesión y armado de los pedidos de perfil y alias. |
| `tests/movimientosUtils.test.mjs` | 9 | Armado de la consulta del historial y conteo de filtros. |

**Usan respuestas simuladas o funciones puras**, así que no validan la integración con la API
real ni con SQL Server: para eso está el flujo manual de arriba.

## Pendientes conocidos

- No hay pantalla para renovar una invitación ni para ver el detalle de un usuario, aunque la
  API tiene esos endpoints.
- Las pantallas de gestión de usuarios del administrador no pasan por `authenticatedRequest`:
  ante un 401 muestran el error pero no cierran la sesión.
- `src/routes/Home.jsx` y `src/routes/ProductId.jsx` quedaron del template original: ninguna
  ruta los importa.
- `package.json` todavía se llama `reactcommerce`, también del template.
- `vercel.json` configura solo este frontend. **No despliega la API .NET**, que necesita su
  propio hosting.
