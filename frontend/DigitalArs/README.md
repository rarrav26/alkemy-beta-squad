# DigitalArs — Frontend

Cliente React de la API DigitalArs. Hecho con Vite, React 19 y Material UI.

- Acceso: login, registro y primera contraseña con invitación.
- Usuario regular: saldo, depósito, transferencia, historial de movimientos, tarjeta virtual
  (generar, ver datos, congelar, pagar y dar de baja), perfil y alias. En el teléfono tiene una
  vista mobile propia, con encabezado y barra inferior (ver **Vista mobile**).
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
| `npm test` | Las 46 pruebas de `tests/` (`node --test`). |

## Estructura

```
src/
├─ main.jsx                        monta BrowserRouter y los providers
├─ App.jsx                         tema MUI y estructura: la de escritorio o la mobile
├─ hooks/
│  ├─ useNavegacionMobile.js       decide si se usa la vista mobile (ver Vista mobile)
│  ├─ useMiCuenta.js               cuenta propia: carga, reintento y refresco del saldo
│  ├─ useOperacionesDeDinero.js    modales de depósito/transferencia y aviso de éxito
│  ├─ useMiTarjeta.js              tarjeta virtual: revelar, congelar, pagar, dar de baja
│  ├─ useSaldoVisible.js           ojo de mostrar/ocultar saldo, recordado en la pestaña
│  ├─ useUltimosMovimientos.js     listas cortas de movimientos (Inicio, Cuentas, Tarjetas)
│  └─ useHistorialMobile.js        historial mobile que crece con "Cargar más"
├─ components/
│  ├─ Main/Main.jsx                las rutas y la protección de navegación
│  ├─ Auth/AuthForm.jsx            formulario común: campos, carga y errores
│  ├─ Admin/                       edición de usuarios y actividad de tarjetas del admin
│  ├─ Cuentas/                     modales de dinero, alias y CVU, saldo animado, tarjeta
│  │                               virtual (TarjetaVisual, TarjetaVirtual de escritorio y
│  │                               sus modales), balance mensual
│  ├─ Header/                      AppBar de escritorio y botón de tema
│  ├─ Navegacion/                  encabezado mobile, barra inferior y menú "Más"
│  ├─ Inicio/                      pantalla Inicio mobile: tarjeta de saldo, atajos, promos
│  ├─ Movimientos/                 listas mobile de movimientos e historial completo mobile
│  ├─ Tarjetas/                    acciones y estado vacío de la pantalla Tarjetas mobile
│  ├─ Comunes/                     título de sección y lista de opciones ("Gestioná tu…")
│  ├─ Proximamente/                aviso y chip "Próximamente", y datosDeMuestra.js
│  ├─ Notificaciones/              campana y panel de avisos
│  ├─ Footer/Footer.jsx            pie de página (solo escritorio)
│  └─ Home/ScrollTopButton.jsx     botón de volver arriba (solo escritorio)
├─ context/
│  ├─ ElementosGlobales.jsx        tema claro/oscuro y tema MUI
│  ├─ AuthProvider.jsx             sesión y operaciones de autenticación
│  ├─ authContext.js               AuthContext y el hook useAuth
│  ├─ NotificacionesProvider.jsx   avisos por REST y en tiempo real (SignalR)
│  └─ api.js                       cliente HTTP (Axios), traducción de errores y tarjetas
└─ routes/
   ├─ AuthPages.jsx                LoginPage, RegisterPage, InitialPasswordPage
   ├─ Dashboard.jsx                Dashboard (escritorio o Inicio mobile) y NewUserPage
   ├─ Cuentas.jsx                  "Tus cuentas" (mobile)
   ├─ Tarjetas.jsx                 "Tus tarjetas" (mobile)
   ├─ Perfil.jsx                   datos personales y alias
   ├─ Movimientos.jsx              historial: paginado en escritorio, "Cargar más" en mobile
   ├─ UsuariosAdmin.jsx            listado, búsqueda y activación de usuarios
   ├─ rolesUtils.js                único lugar que lee el rol de la sesión
   └─ dashboardUtils.js, movimientosUtils.js, navegacionUtils.js, perfilUtils.js
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
| `/movimientos` | Usuario | Historial de la billetera. El administrador no tiene una. En mobile acepta `?buscar=` para abrirse ya filtrado. |
| `/cuentas` | Usuario | "Tus cuentas": tarjeta de saldo, movimientos, balance y gestión de la cuenta. |
| `/tarjetas` | Usuario | "Tus tarjetas": tarjeta virtual, pagos con tarjeta y gestión de la tarjeta. |
| `/usuarios/nuevo` | Administrador | Alta de usuario, devuelve la invitación. |
| `/admin/usuarios` | Administrador | Listado, edición y activación de usuarios. |
| `/setup` | — | Redirige a `/login`; quedó por compatibilidad. |
| cualquier otra | — | Redirige a `/`. |

La protección de rutas organiza la navegación. **La autorización real la hace la API**: un
usuario sin rol Administrador que llegue a `/usuarios/nuevo` igual recibe 403 del backend.

Cada ruta declara el rol que pide con `<Protected rol={...}>` en `Main.jsx`. Quien no lo tiene
vuelve a `/dashboard`. El rol se lee siempre con `src/routes/rolesUtils.js`: es el único lugar
que sabe cómo viene en la sesión, así que ningún componente lo compara a mano.

`/cuentas` y `/tarjetas` funcionan en cualquier ancho, pero están pensadas para mobile: se
entra desde la barra inferior. En escritorio, "Cuentas" tiene link en el AppBar y la tarjeta
se ve dentro del Dashboard, así que `/tarjetas` no tiene link.

## Vista mobile

Por debajo del breakpoint `md` de MUI, y **solo para un usuario regular con la sesión
verificada**, la app cambia de estructura. Lo decide un único hook, `useNavegacionMobile`, que
leen `App.jsx` y las pantallas que tienen dos versiones (Dashboard y Movimientos):

| Escritorio | Mobile |
|---|---|
| AppBar con links, Footer y botón de volver arriba | Encabezado con saludo, campana y tema; barra inferior fija con Inicio, Cuentas, QR, Tarjetas y Más |
| Dashboard con saldo, botones y tarjeta | Inicio: tarjeta de saldo, atajos, promociones y últimos movimientos |
| Historial paginado con Anterior / Siguiente | Historial con buscador, chips Todos / Ingresos / Egresos, filtro de fechas y "Cargar más" |

El administrador ve siempre la versión de escritorio: no tiene billetera. La barra de scroll de
la página se oculta en mobile (en el teléfono no se usa y en una ventana angosta ocupaba lugar).

Algunas decisiones que conviene conocer antes de tocar estas pantallas:

- **Lógica en hooks, pantallas que solo dibujan.** El saldo (`useMiCuenta`), los modales de
  dinero (`useOperacionesDeDinero`) y la tarjeta (`useMiTarjeta`) viven en hooks que comparten
  la versión de escritorio y la mobile. Una regla de negocio nueva va en el hook, una sola vez.
- **Saldo oculto.** Arranca oculto ("Shh…"). Si el usuario lo muestra, queda recordado en
  `sessionStorage` bajo `digitalars.saldoVisible.<usuarioId>` hasta que cierra la pestaña. Al
  revelarse, el número sube desde 0 con una pausa de 300 ms (`SaldoRevelado.jsx`).
- **Listas que se actualizan solas.** Las listas cortas de movimientos se recargan cuando
  cambia el saldo, y el historial mobile cuando llega un aviso en tiempo real. No hay
  consultas periódicas en mobile.
- **Todo lo de muestra está marcado.** Lo que todavía no existe en la API (cuentas en otras
  monedas, crédito, balance mensual, algunas opciones de gestión) lee sus datos de
  `components/Proximamente/datosDeMuestra.js`, el **único** archivo con datos inventados, y
  lleva el chip o el aviso "Próximamente". El diseño toma como referencia otra billetera, pero
  no usa ningún nombre de producto, eslogan ni marca de esa app.
- **La tarjeta es la única excepción a los colores del tema:** su degradé violeta (el
  plástico) está en `COLORES_DEL_PLASTICO` de `TarjetaVisual.jsx`. Todo lo demás pide los
  colores por nombre a la paleta.
- **MUI 9:** `Typography` ignora sin avisar `fontWeight` como prop y en `color` solo acepta
  nombres sueltos; `Stack` ya no acepta `alignItems` ni `justifyContent` como props. Todo eso
  va en `sx`.

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

Los componentes llaman a la API a través del hook. Hay dos excepciones que usan funciones de
`api.js` y les pasan el token a mano: la gestión de usuarios del administrador
(`UsuariosAdmin.jsx` y `EditarUsuarioModal.jsx`) y la tarjeta virtual (`useMiTarjeta.js`). Por
eso un 401 en esas pantallas muestra un error pero no cierra la sesión.

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
| Tarjeta | `GET /api/tarjetas/me`, `POST /api/tarjetas`, `POST /api/tarjetas/me/revelar`, `PATCH /api/tarjetas/me/congelada`, `PATCH /api/tarjetas/me/baja`, `POST /api/tarjetas/me/pagar` |
| Avisos | `GET /api/notificaciones`, `PATCH /api/notificaciones/{id}/leida`, `PATCH /api/notificaciones/leidas`, y el hub SignalR `/hubs/notificaciones` |
| Administrador | `GET /api/usuarios`, `POST /api/usuarios`, `PATCH /api/usuarios/{id}`, `PATCH /api/usuarios/{id}/active`, `GET /api/tarjetas/resumen/{usuarioId}` |

Cada fila de `GET /api/movimientos` trae, además de tipo, signo e importe, `ultimosCuatro`
(la tarjeta de un pago, para mostrar "Pago con tarjeta •••• 3435") y `contraparte` (el titular
de la otra cuenta en una transferencia, para mostrar "Para …" o "De …"). Los dos son `null` en
los movimientos que no los tienen.

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

Son 46 pruebas en 5 archivos:

| Archivo | Pruebas | Qué cubre |
|---|---|---|
| `tests/api.test.mjs` | 8 | Cliente HTTP: headers, JSON, 204 sin cuerpo, 429, fallo de red, cancelación y mensajes de error. |
| `tests/roles.test.mjs` | 8 | Qué rutas ve cada rol y cuándo la sesión cuenta como activa. |
| `tests/dashboard.test.mjs` | 3 | Usuario de la sesión y armado de los pedidos de perfil y alias. |
| `tests/movimientosUtils.test.mjs` | 22 | Consulta del historial, conteo de filtros, fecha corta en hora argentina, signo e importe, "Para / De" de la contraparte, unión de páginas sin repetidos y rango de fechas. |
| `tests/navegacion.test.mjs` | 5 | Qué pestaña de la barra inferior se marca en cada ruta. |

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
- Vista mobile: el QR y varias opciones ("Gestioná tu cuenta", "Gestioná tu tarjeta", otras
  monedas, crédito, balance mensual) son de muestra y responden "Próximamente".
- Un pago con tarjeta no muestra a quién se le pagó: el backend guarda el pago y el cobro sin
  enlazarlos entre sí.
- `/tarjetas` abierta en escritorio: "Ver más" lleva al historial de escritorio, que ignora
  `?buscar=`.
- `src/context/api.js` tiene dos errores de lint (una variable sin usar y una asignación sin
  efecto) que vinieron con la rama de tarjetas.
- `Dashboard.jsx` (escritorio) todavía pasa `alignItems` como prop de `Stack`, que MUI 9 manda
  al DOM y React avisa en consola.
