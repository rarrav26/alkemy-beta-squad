# Spec: Notificaciones de cuenta (con aviso en tiempo real)

**Proyecto:** DigitalArs – Billetera Virtual (Beta Squad)
**Rama:** `hu-extra-Notificaciones-websockets` (desde `dev`)
**Ubicación sugerida en el repo:** `docs/specs/notificaciones.md`
**Estado:** Adaptado al código y a la base local al 2026-09-23. Listo para implementar.

---

## 0. Qué cambió respecto del spec original y por qué

| Spec original | Este spec | Motivo |
|---|---|---|
| Solo notifica transferencias **recibidas** | Notifica **recibidas, enviadas y depósitos** | Lo exige el primer criterio de aceptación de la HU. |
| FK a `AspNetUsers.Id` (`nvarchar(450)`) | FK a `Usuarios.id` (`int`) | El negocio vive en `Usuarios`; `Cuentas` y `Movimientos` ya cuelgan de ahí. Las tablas de Identity quedan fuera del scaffold a propósito. |
| Columnas en PascalCase | snake_case (`usuario_id`, `leida`, `fecha`) | Es la convención real de la base (`--use-database-names`). |
| `Eliminada`, `FechaLectura`, `Tipo` + `CHECK` | Se quitan | La HU no pide eliminar ni fecha de lectura. El tipo se deduce del movimiento asociado. Menos columnas, menos código. |
| Endpoints de eliminar (x2) + contador aparte + paginación | 3 endpoints: listar (con contador incluido), marcar una, marcar todas | Es exactamente lo que piden los criterios. |
| `UsuarioIdProvider` propio | Sin provider propio | El JWT ya trae `sub` = id de Identity, que .NET mapea a `ClaimTypes.NameIdentifier`: es lo que SignalR usa por defecto y lo que ya leen todos los controllers. |
| Hub que revisa `Activo` en `OnConnectedAsync` con `ApplicationUser` | Hub vacío | No existe `ApplicationUser` (se usa `IdentityUser`) y el estado está en `Usuarios.is_active`. Además `OnTokenValidated` en `Program.cs` **ya** rechaza tokens de usuarios desactivados en cada request, incluida la conexión al hub. |
| Unit of Work (`_unitOfWork.BeginTransactionAsync`) | `context.Database.BeginTransactionAsync` | No hay Unit of Work en el proyecto; los servicios abren la transacción directo sobre el `DbContext`. |
| `notistack` | `Snackbar` + `Alert` de MUI | Una dependencia menos. Si llegan dos avisos seguidos se ve el último, pero la campana guarda los dos. |
| Nota sobre React StrictMode | Se quita | `main.jsx` no usa StrictMode. |
| Tareas con la campana como "opcional" | La campana es **obligatoria**; el tiempo real es lo que se agrega para la demo | Todos los criterios de la HU se cumplen con REST + campana. SignalR es el plus que hace lucir la demo. |
| Sin plan para celulares | Sección 8: demo en dos celulares por la red local | El backend hoy solo escucha en `localhost` con HTTPS de desarrollo, que un celular no acepta. |

---

## 1. Historia de usuario

Como usuario autenticado, quiero recibir notificaciones ante eventos relevantes de mi cuenta, para estar al tanto de la actividad sin revisar manualmente.

### Criterios de aceptación → dónde se cumple cada uno

| # | Criterio | Cómo se cumple |
|---|---|---|
| CA1 | Notifica como mínimo transferencias recibidas, transferencias realizadas y depósitos | `TransferenciaService` crea 2 notificaciones (origen y destino) y `DepositoService` crea 1, dentro de su transacción (§4.3). |
| CA2 | El usuario puede consultar sus notificaciones | `GET /api/notificaciones` + panel de la campana (§4.4, §5.4). |
| CA3 | No notifica eventos de otros usuarios | Cada notificación tiene `usuario_id`; el endpoint filtra por el usuario del token y el push va solo a ese usuario (`Clients.User`). |
| CA4 | Orden cronológico descendente | `ORDER BY fecha DESC, id DESC` en el repositorio; los avisos nuevos se agregan arriba en el front. |
| CA5 | Marcar una como leída al hacerle clic | Click en el ítem → `PATCH /api/notificaciones/{id}/leida`. |
| CA6 | Opción para marcar todas como leídas | Botón en el encabezado del panel → `PATCH /api/notificaciones/leidas`. |
| CA7 | Globito rojo con la cantidad de no leídas, se actualiza al marcar; con 10 o más muestra `9+` | MUI `<Badge color="error" max={9}>`: con 10 o más muestra `9+` solo, y con 0 se oculta. |

### Fuera de alcance

- Notificaciones con la app cerrada (Web Push, email, SMS).
- Eliminar notificaciones y preferencias por usuario.
- Notificaciones para el rol Administrador (no tiene billetera).

---

## 2. Decisiones técnicas

| Decisión | Elección | Motivo |
|---|---|---|
| Fuente de verdad | Tabla `Notificaciones` | Una notificación no es un movimiento: `Movimientos` es append-only (no admite UPDATE), y marcar como leída es un UPDATE. |
| Momento de guardar | **Dentro** de la transacción del depósito/transferencia | Si la operación se revierte, la notificación también. |
| Tiempo real | ASP.NET Core **SignalR** | Viene incluido en el framework (no hay que instalar ningún paquete NuGet), reconecta solo y se integra con el JWT existente. |
| Momento del push | **Después** del `CommitAsync` | Si se envía antes y después hay rollback, el usuario vería plata que nunca llegó. |
| Falla del push | Se loguea y se ignora | El push es un aviso de "best effort": la notificación ya está en la base y aparece al recargar. |
| Ruteo | `Clients.User(identity_user_id)` | SignalR ya relaciona usuario → conexiones (varias pestañas incluidas). |
| Cliente front | `@microsoft/signalr` | El `WebSocket` nativo no habla el protocolo de SignalR. |

---

## 3. Arquitectura y flujo

```
[Celular A]  POST /api/Transferencias           (REST, sin cambios de contrato)
      │
      ▼
TransferenciaService.TransferirAsync
  ├─ BEGIN TRANSACTION
  │    ├─ débito origen / crédito destino           (existente)
  │    ├─ 2 movimientos                              (existente)
  │    ├─ INSERT notificación para A (enviada)       ◄── NUEVO
  │    └─ INSERT notificación para B (recibida)      ◄── NUEVO
  ├─ COMMIT
  └─ INotificadorEnTiempoReal.EnviarAsync(A y B)     ◄── NUEVO, fuera de la transacción
            │
            ▼
   NotificacionesHub  →  Clients.User(identity_user_id)
            │  WebSocket
            ▼
[Celular B]  NotificacionesProvider
  ├─ Snackbar "Recibiste $ 15.000,00 de Juan Pérez"
  ├─ la notificación entra arriba en la lista y el globito suma 1
  └─ el Dashboard vuelve a pedir el saldo  →  el saldo sube en pantalla
```

Del lado de A el saldo ya baja hoy sin nada nuevo: `Dashboard.transferenciaRealizada` usa el `saldoActual` que devuelve la API. Lo único nuevo para A es que su notificación "Enviaste…" también le llega por push.

---

## 4. Backend

### 4.1 Modelo real verificado (T0 hecho)

Consultado contra `.\SQLEXPRESS01` / `DigitalArs` el 2026-09-23:

- Tablas de negocio: `Usuarios`, `Cuentas`, `Movimientos`, `Tipo_Movimiento`. Todas con PK `id INT IDENTITY`, salvo `Tipo_Movimiento`, que la carga a mano.
- `Usuarios.identity_user_id NVARCHAR(450) NULL`: vínculo con `AspNetUsers.Id`, **sin FK** a propósito.
- El estado activo es `Usuarios.is_active BIT`.
- Roles en `AspNetRoles`: `Usuario` y `Administrador` (constantes en `Helpers/Domain/RolPrincipal.cs`).
- `Tipo_Movimiento`: 1 `DEPOSITO`, 2 `TRANSFERENCIA_ENVIADA`, 3 `TRANSFERENCIA_RECIBIDA`.
- Collation `Modern_Spanish_CI_AS`. Fechas en UTC en `DATETIME2(3)`.
- Flujo de esquema: **Database-First** con scripts versionados en `database/` + scaffold (lo dicen `backend/DigitalArs.Api/README.md` y `MAP.md`). No hay migraciones.

### 4.2 Script — `database/Notificaciones(v.001).sql`

No se toca `Create(v.002).sql`: ese script hace `DROP` de todas las tablas. Este script nuevo es aditivo y se puede correr más de una vez.

```sql
/* ============================================================================
   DigitalArs - Billetera Virtual
   Script Notificaciones (v.001): tabla de notificaciones de cuenta
   Requiere: Create(v.002).sql
   ============================================================================ */
USE DigitalArs;
GO

IF OBJECT_ID(N'dbo.Notificaciones', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notificaciones
    (
        id             INT             NOT NULL IDENTITY(1,1),
        usuario_id     INT             NOT NULL,
        /* El movimiento que la originó: da trazabilidad y de ahí sale el tipo
           (depósito, enviada, recibida) sin duplicarlo en otra columna. */
        movimiento_id  INT             NOT NULL,
        titulo         NVARCHAR(100)   NOT NULL,
        mensaje        NVARCHAR(300)   NOT NULL,
        leida          BIT             NOT NULL CONSTRAINT DF_Notificaciones_Leida DEFAULT (0),
        fecha          DATETIME2(3)    NOT NULL,

        CONSTRAINT PK_Notificaciones PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_Notificaciones_Usuarios
            FOREIGN KEY (usuario_id)    REFERENCES dbo.Usuarios (id),
        CONSTRAINT FK_Notificaciones_Movimientos
            FOREIGN KEY (movimiento_id) REFERENCES dbo.Movimientos (id)
    );

    /* Cubre las dos consultas del panel: el listado por fecha y el conteo de no leídas. */
    CREATE INDEX IX_Notificaciones_Usuario_Fecha
        ON dbo.Notificaciones (usuario_id, fecha DESC)
        INCLUDE (leida);
END;
GO
```

### 4.3 Scaffold

Desde `backend/DigitalArs.Api`, con la variable de entorno exportada como indica el README:

```powershell
dotnet ef dbcontext scaffold "$env:ConnectionStrings__DefaultConnection" Microsoft.EntityFrameworkCore.SqlServer --project "DigitalArs.Api.csproj" --startup-project "DigitalArs.Api.csproj" --context DigitalArsDbContext --context-dir Data/Context --output-dir Data/Entities --namespace DigitalArs.Api.Data.Entities --context-namespace DigitalArs.Api.Data.Context --no-onconfiguring --use-database-names --force --table Usuarios --table Cuentas --table Movimientos --table Tipo_Movimiento --table Notificaciones
```

- Los `--table` son **obligatorios**. El comando del README no los tiene, y sin ellos el scaffold mete las 7 tablas `AspNet*` en `DigitalArsDbContext`, que choca con `AuthDbContext`.
- `--force` pisa las entidades y el contexto. Hoy no tienen personalizaciones, pero **revisar el `git diff`** antes de commitear: lo esperado es solo `Notificacion.cs` nuevo, y en las entidades existentes, `DbSet<Notificacion>`, el bloque de `OnModelCreating` y las colecciones de navegación en `Usuario` y `Movimiento`.
- Actualizar `database/Diagrama_ER.png`.

### 4.4 Archivos nuevos y modificados

Sigue la estructura existente: Controller → Service → Repository → DbContext, con interfaces en `Interfaces/`.

| Archivo | Qué es |
|---|---|
| `Helpers/Domain/MensajesDeNotificacion.cs` | `static`, sin dependencias: arma título y mensaje de cada tipo. Formatea el importe con `CultureInfo("es-AR")` fijo para no depender de la cultura del servidor. |
| `Interfaces/INotificacionRepository.cs` + `Repositories/NotificacionRepository.cs` | `AddAsync`, `ListarDelUsuarioAsync`, `ContarNoLeidasAsync`, `MarcarLeidaAsync`, `MarcarTodasLeidasAsync`. |
| `Interfaces/INotificacionService.cs` + `Services/NotificacionService.cs` | Resuelve `identityUserId → Usuario` (igual que `HistorialService`) y delega en el repositorio. Devuelve `Resultado<T>`. |
| `Interfaces/INotificadorEnTiempoReal.cs` + `Services/NotificadorSignalR.cs` | Envía por SignalR. **Atrapa y loguea su propia excepción**, así los servicios no repiten el try/catch. |
| `Hubs/NotificacionesHub.cs` | Carpeta nueva: un hub no es un controller. |
| `DTOs/NotificacionResponse.cs`, `DTOs/NotificacionesResponse.cs` | Contratos de salida (§4.7). |
| `Controllers/NotificacionesController.cs` | 3 endpoints (§4.8). |
| `Services/TransferenciaService.cs`, `Services/DepositoService.cs` | Crean la notificación en la transacción y envían el push después del commit. |
| `Program.cs` | Registros, SignalR, JWT por query string, CORS y `MapHub`. |

Mensajes (en `MensajesDeNotificacion`):

| Evento | Para | Título | Mensaje |
|---|---|---|---|
| Depósito | quien deposita | Ingreso de dinero | Ingresaste $ 5.000,00 a tu cuenta |
| Transferencia | origen | Transferencia enviada | Enviaste $ 15.000,00 a María González |
| Transferencia | destino | Transferencia recibida | Recibiste $ 15.000,00 de Juan Pérez |

### 4.5 Integración en los servicios

**TransferenciaService.TransferirAsync.** Después del segundo `SaveChangesAsync` (cuando `movDebito.id` y `movCredito.id` ya existen) y **antes** de `transaccion.CommitAsync`:

```csharp
var notificacionEnviada = new Notificacion
{
    usuario_id = usuarioOrigen.id,
    movimiento_id = movDebito.id,
    titulo = MensajesDeNotificacion.TituloTransferenciaEnviada,
    mensaje = MensajesDeNotificacion.TransferenciaEnviada(importe, nombreDestino),
    fecha = fechaOperacion
};
// ...y lo mismo para notificacionRecibida, con cuentaDestino.usuario_id y movCredito.id

await notificaciones.AddAsync(notificacionEnviada, cancellationToken);
await notificaciones.AddAsync(notificacionRecibida, cancellationToken);

await transaccion.CommitAsync(cancellationToken);

// Recién con la transferencia confirmada: si esto falla, la plata y las notificaciones ya están en la base.
await notificador.EnviarAsync(identityUserId, notificacionEnviada);
await notificador.EnviarAsync(cuentaDestino.usuario.identity_user_id, notificacionRecibida);
```

**DepositoService.DepositarAsync.** Después de `movimientos.AddAsync(movimiento)` va el `AddAsync` de la notificación, y después de `transaccion.CommitAsync` el `EnviarAsync`.

Notas:

- `NotificacionRepository.AddAsync` hace `SaveChangesAsync`, igual que `MovimientoRepository.AddAsync`. Como usa el mismo `DbContext`, queda dentro de la transacción abierta.
- `identity_user_id` es nullable. Si viene `null`, `NotificadorSignalR` no envía nada (early return). No debería pasar con un usuario activo, pero no se asume.
- El `CancellationToken` del request **no** se pasa al push: si el cliente cortó justo después del commit, al otro usuario igual le tiene que llegar el aviso.

### 4.6 SignalR

**Hub.** No expone métodos: la comunicación es solo servidor → cliente.

```csharp
[Authorize(Roles = RolPrincipal.Usuario)]
public class NotificacionesHub : Hub
{
}
```

**Notificador.**

```csharp
public class NotificadorSignalR(
    IHubContext<NotificacionesHub> hub,
    ILogger<NotificadorSignalR> logger) : INotificadorEnTiempoReal
{
    public async Task EnviarAsync(string? identityUserId, Notificacion notificacion)
    {
        if (string.IsNullOrWhiteSpace(identityUserId))
            return;

        try
        {
            var respuesta = NotificacionResponse.Desde(notificacion);
            await hub.Clients.User(identityUserId).SendAsync("NuevaNotificacion", respuesta);
        }
        catch (Exception error)
        {
            // Un problema de SignalR no puede hacer fallar una operación ya confirmada.
            logger.LogWarning(error, "No se pudo enviar la notificación {Id} en tiempo real.", notificacion.id);
        }
    }
}
```

**`Program.cs`**, cambios puntuales:

1. Sección 2: `builder.Services.AddScoped<INotificacionRepository, NotificacionRepository>();`
2. Sección 4: `AddScoped<INotificacionService, NotificacionService>()`, `AddScoped<INotificadorEnTiempoReal, NotificadorSignalR>()` y `builder.Services.AddSignalR();`
3. Sección 7: **agregar** `OnMessageReceived` dentro del `new JwtBearerEvents { ... }` que ya existe, al lado de `OnTokenValidated`. **No crear otro `options.Events = new ...`**: el segundo reemplaza al primero y se pierde la verificación de usuario desactivado.

   ```csharp
   OnMessageReceived = context =>
   {
       // El navegador no deja mandar headers al abrir un WebSocket, así que el cliente
       // de SignalR manda el JWT como ?access_token=. Solo se acepta ahí, en el hub.
       var token = context.Request.Query["access_token"];
       var esElHub = context.HttpContext.Request.Path.StartsWithSegments("/hubs/notificaciones");

       if (esElHub && !string.IsNullOrEmpty(token))
           context.Token = token;

       return Task.CompletedTask;
   },
   ```

4. Sección 10, CORS: agregar `.AllowCredentials()` a la política `"Frontend"`. Se puede porque los orígenes ya son explícitos (`WithOrigins`), no `AllowAnyOrigin`.
5. Sección 12: `app.MapHub<NotificacionesHub>("/hubs/notificaciones");` justo después de `app.MapControllers();`.

Consecuencia de seguridad: el token queda en la URL del hub y puede aparecer en logs de acceso. Para el alcance del proyecto es aceptable.

### 4.7 DTOs

```json
// NotificacionResponse: el mismo formato en el push y en el listado REST
{
  "id": 42,
  "titulo": "Transferencia recibida",
  "mensaje": "Recibiste $ 15.000,00 de Juan Pérez",
  "leida": false,
  "movimientoId": 318,
  "fecha": "2026-09-23T15:42:10-03:00"
}

// NotificacionesResponse: lo que devuelve GET /api/notificaciones
{
  "noLeidas": 12,
  "items": [ /* las 30 más recientes, de la más nueva a la más vieja */ ]
}
```

`fecha` sale con `HoraDeArgentina.DesdeUtc(...)`, igual que `DepositoResponse.Fecha`.
`noLeidas` cuenta **todas** las no leídas, no solo las 30 que vienen en la lista: el globito tiene que ser correcto aunque haya más.

La lista se llama `items` y no `notificaciones` para que sea igual que `PaginaResponse.Items`, que es lo que ya devuelven el historial y el listado de usuarios: un solo nombre para "el contenido de una respuesta con varios elementos".

### 4.8 Endpoints

`NotificacionesController`, con `[Authorize(Roles = RolPrincipal.Usuario)]`. Mismo esqueleto que `MovimientosController`: leer `ClaimTypes.NameIdentifier`, llamar al servicio y traducir el `MotivoDeRechazo` a un status. El usuario **siempre** sale del token, nunca de la URL ni del body.

| Método | Ruta | Qué hace | Respuestas |
|---|---|---|---|
| `GET` | `/api/notificaciones` | Últimas 30 + contador de no leídas | 200, 401, 403 |
| `PATCH` | `/api/notificaciones/{id}/leida` | Marca una como leída. Idempotente. | 204, 404, 401, 403 |
| `PATCH` | `/api/notificaciones/leidas` | Marca todas las del usuario como leídas | 204, 401, 403 |

- Una notificación que existe pero es de otro usuario responde **404**, no 403, para no revelar que el id existe (el `WHERE` filtra por `id` **y** `usuario_id`).
- Marcar todas usa `ExecuteUpdateAsync`, que es un solo `UPDATE` sin cargar filas en memoria.
- Documentar los `[ProducesResponseType]` como el resto, y sumar los 3 endpoints a la colección de `docs/apidog/`.

---

## 5. Frontend

### 5.1 Dependencia

```bash
npm install @microsoft/signalr
```

La URL del hub se arma con la misma base que Axios: `${VITE_API_URL}/hubs/notificaciones`.

### 5.2 Dónde va cada cosa

```
main.jsx
└─ BrowserRouter
   └─ ElementosGlobalesProvider
      └─ AuthProvider
         └─ NotificacionesProvider      ◄── NUEVO: estado, conexión SignalR y Snackbar
            └─ App
               ├─ ResponsiveAppBar
               │  └─ CampanaDeNotificaciones   ◄── NUEVO
               └─ Main → Dashboard (se suscribe al aviso para refrescar el saldo)
```

Archivos:

```
src/context/notificacionesContext.js          // createContext + useNotificaciones (igual que authContext.js)
src/context/NotificacionesProvider.jsx
src/components/Notificaciones/CampanaDeNotificaciones.jsx
src/components/Notificaciones/ItemDeNotificacion.jsx
```

Las llamadas REST se agregan a `AuthProvider` con `authenticatedRequest`, como `obtenerMovimientos`, para heredar el cierre de sesión ante un 401 o un usuario desactivado:
`obtenerNotificaciones()`, `marcarNotificacionLeida(id)` y `marcarTodasLeidas()`.

### 5.3 NotificacionesProvider

Solo se activa si `sesionVerificada` y el rol es `Usuario` (`esAdministrador(session)` es `false`).

1. Al activarse, carga lista y contador con `GET /api/notificaciones`.
2. Abre la conexión SignalR con `accessTokenFactory: () => session.token` y `.withAutomaticReconnect()`.
3. En `'NuevaNotificacion'`: la agrega al principio de la lista (salvo que ya esté ese `id`), suma 1 a `noLeidas`, muestra el Snackbar e incrementa `avisosRecibidos`.
4. En `onreconnected`: vuelve a cargar por REST. SignalR no guarda lo enviado mientras el cliente estaba desconectado.
5. En el cleanup del efecto (logout, vencimiento del token o cambio de usuario): `connection.stop()`. El efecto depende de `session?.token`, así que un token nuevo abre una conexión nueva.

Valor del contexto:

```js
{ notificaciones, noLeidas, cargando, error, avisosRecibidos,
  recargar, marcarLeida(id), marcarTodasLeidas() }
```

Actualización optimista en `marcarLeida` y `marcarTodasLeidas`: se cambia el estado local y el contador, se llama a la API y, si falla, se vuelve atrás y se muestra el error en el mismo Snackbar (`severity="error"`).

Snackbar: MUI `<Snackbar>` con `<Alert severity="info">`, `autoHideDuration={5000}` y `anchorOrigin={{ vertical: 'top', horizontal: 'center' }}`, que en celular queda bien a la vista.

### 5.4 Refresco del saldo (lo más visible de la demo)

Revisado `Dashboard.jsx`: el saldo se carga en un `useEffect` que depende de `[obtenerMiCuenta, esAdmin, intento]`, y ese efecto pone `cuenta = null` y muestra "Cargando tu cuenta…". **Reusar `intento` haría parpadear la tarjeta.** Se agrega un efecto aparte que pide la cuenta en silencio:

```jsx
const { avisosRecibidos } = useNotificaciones()

useEffect(() => {
  if (avisosRecibidos === 0) return
  obtenerMiCuenta().then(datos => setCuenta(datos)).catch(() => {})
}, [avisosRecibidos, obtenerMiCuenta])
```

Opcional, para que en la demo también aparezca el movimiento nuevo: agregar `avisosRecibidos` a las dependencias del `useEffect` de `MovimientosPreview` (`src/routes/Movimientos.jsx`).

### 5.5 CampanaDeNotificaciones

- Va en `ResponsiveAppBar`, **fuera** del bloque que solo se ve desde `md`, a la izquierda de `ChangeTheme`. Así se ve también en celular, que es donde se hace la demo. Solo se muestra si `sesionActiva && !esAdmin`.
- `IconButton aria-label="Notificaciones"` → `<Badge badgeContent={noLeidas} color="error" max={9}>` → `NotificationsIcon`. El `9+` y el ocultarse con 0 los da MUI solos (CA7).
- Al hacer click: `Popover` anclado al botón, `width: { xs: 'calc(100vw - 32px)', sm: 360 }`, alto máximo de unos 420px con scroll interno.
- Encabezado: título "Notificaciones" + botón "Marcar todas como leídas", deshabilitado con `noLeidas === 0`.
- Cuerpo: `List` de `ItemDeNotificacion` en el orden en que vienen (la más nueva arriba).
  - No leída: fondo `action.hover`, título en negrita y un punto de color.
  - Texto primario `titulo`; secundario `mensaje` + fecha (`toLocaleString('es-AR')`).
  - Click en el ítem: `marcarLeida(id)` si todavía no estaba leída.
- Estados: `CircularProgress` al cargar; "No tenés notificaciones" si está vacía; `Alert` de error con "Reintentar".

---

## 6. Reglas de negocio

1. Se notifica solo cuando la operación se confirma: el depósito a quien deposita, y la transferencia al origen y al destino.
2. Una operación rechazada o revertida no deja notificación ni en la base ni por push.
3. Cada usuario ve y gestiona solo sus notificaciones.
4. Marcar como leída no afecta al movimiento asociado.
5. Un usuario desactivado no puede conectarse al hub ni consultar el endpoint (lo corta `OnTokenValidated`). Tampoco puede recibir transferencias, así que no se le generan notificaciones nuevas.
6. El Administrador no tiene campana ni se conecta al hub.

---

## 7. Plan de pruebas manuales

Preparación: dos usuarios activos con cuenta (A con saldo y B), cada uno en su celular (§8). Como plan B, dos pestañas en Chrome con la vista de dispositivo: la sesión vive en `sessionStorage`, que es por pestaña.

| # | Caso | Resultado esperado | CA |
|---|---|---|---|
| 1 | A transfiere a B | A: el saldo baja y le llega "Enviaste…". B: Snackbar "Recibiste…", el globito +1 y el saldo sube sin recargar. | 1, 3 |
| 2 | A deposita | A recibe "Ingresaste…". B no recibe nada. | 1, 3 |
| 3 | A intenta transferir más que su saldo | Nadie recibe nada y no se crea ninguna fila en `Notificaciones`. | – |
| 4 | B cierra la app, A transfiere, B entra | La notificación aparece en la campana. | 2 |
| 5 | B abre el panel | La lista va de la más nueva a la más vieja y las no leídas se distinguen. | 4 |
| 6 | B toca una no leída y recarga | Sigue leída y el globito bajó 1. | 5, 7 |
| 7 | B toca "Marcar todas como leídas" | El globito desaparece; al recargar sigue en 0. | 6, 7 |
| 8 | B con 10 o más no leídas | El globito muestra `9+`. | 7 |
| 9 | Cortar el backend con B conectado y volver a levantarlo | B se reconecta solo y el historial se recarga. | – |
| 10 | Swagger: `GET /api/notificaciones` con el token de A | Solo devuelve las de A. | 3 |
| 11 | Swagger: `PATCH /api/notificaciones/{id}/leida` con un id de otro usuario | 404 | 3 |
| 12 | Swagger: los endpoints sin token / con token de Admin | 401 / 403 | – |

Para el caso 8, generar diez depósitos chicos desde Swagger con el usuario B (sin marcarlos como leídos).

---

## 8. Preparar la demo en dos celulares

Hoy el backend escucha en `https://localhost:7201`. Un celular no llega a `localhost` de la notebook y no confía en el certificado HTTPS de desarrollo. Para la demo se usa **HTTP por la red local**. Todo esto es configuración local: no se commitea.

1. **Backend.** En `Properties/launchSettings.json` (no está versionado) agregar un perfil `"DemoLAN"` copiado del existente, con `"applicationUrl": "http://0.0.0.0:5201"` y sin la URL https. Sin puerto HTTPS configurado, `UseHttpsRedirection` no redirige. Levantarlo con `dotnet run --launch-profile DemoLAN`.
2. **IP de la notebook:** `ipconfig` → IPv4 de la red WiFi, por ejemplo `192.168.0.50`.
3. **CORS:** agregar `"Cors": { "AllowedOrigins": ["http://localhost:5173", "http://192.168.0.50:5173"] }` en `appsettings.Development.json` local, o como variables de entorno en el perfil (`Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`). Van **los dos**: si se configura la lista, `Program.cs` deja de agregar `localhost` por su cuenta.
4. **Frontend:** en `.env.local` poner `VITE_API_URL=http://192.168.0.50:5201` y levantar con `npm run dev -- --host`.
5. **Firewall de Windows:** permitir entrada en los puertos 5173 y 5201 para redes privadas, y que la red WiFi esté marcada como privada.
6. **Celulares** en la misma WiFi, entrando a `http://192.168.0.50:5173`. A en uno y B en el otro.
7. Ensayar el guion completo (casos 1, 2, 5, 6 y 7) **en la misma red donde se presenta**. Algunas redes de facultad u oficina aíslan los dispositivos entre sí. Plan B: hotspot del propio celular, o las dos pestañas de Chrome con vista de dispositivo.

Guion sugerido (unos 2 minutos): mostrar los dos saldos → A transfiere $15.000 a B → en simultáneo baja el saldo de A y sube el de B, con el Snackbar y el globito en B → B abre la campana y toca la notificación (el globito baja) → A deposita y muestra su campana con "Enviaste…" e "Ingresaste…" → "Marcar todas como leídas".

---

## 9. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Se reemplaza `options.Events` en vez de sumarle `OnMessageReceived` | Los usuarios desactivados vuelven a pasar la validación | Agregar la propiedad dentro del objeto existente (§4.6 paso 3) y probar el caso 12 con un usuario desactivado. |
| Scaffold sin `--table` | Entidades `AspNet*` duplicadas y el build roto | Usar el comando de §4.3 y revisar el `git diff`. |
| CORS sin `AllowCredentials` o sin la IP de la LAN | La conexión falla en la negociación | §4.6 paso 4 y §8 paso 3. |
| El push se envía antes del commit | Avisos de plata que no llegó | El `EnviarAsync` va siempre después de `CommitAsync`. |
| Push perdido durante una desconexión | Lista desactualizada | Recarga en `onreconnected`. La base es la fuente de verdad. |
| La red de la demo aísla dispositivos | La demo no conecta | Ensayo previo en el lugar y plan B de hotspot o pestañas (§8.7). |
| Falta tiempo | Extra incompleto | Orden de §10: primero lo que cumple la HU, después el tiempo real. |

---

## 10. Tareas (en orden)

Todo en la rama `hu-extra-Notificaciones-websockets`. Commits por tarea.

| # | Tarea | Depende de | Cumple |
|---|---|---|---|
| T1 | Script `Notificaciones(v.001).sql`, correrlo, scaffold con `--table` y ER actualizado | – | base |
| T2 | `MensajesDeNotificacion` + `NotificacionRepository` + creación en `TransferenciaService` y `DepositoService` (sin push) | T1 | CA1 |
| T3 | `NotificacionService` + `NotificacionesController` + Swagger + colección de Apidog | T2 | CA2–CA6 |
| T4 | Front: métodos en `AuthProvider`, `NotificacionesProvider` (solo REST) y `CampanaDeNotificaciones` | T3 | CA2–CA7 |
| — | **Punto de corte: con T1 a T4 la HU está completa** (con recarga manual) | | |
| T5 | SignalR en el backend: `Program.cs`, hub, `NotificadorSignalR` y push después del commit | T2 | demo |
| T6 | SignalR en el front: conexión en el provider, Snackbar y refresco de saldo en `Dashboard` (y `MovimientosPreview`) | T4, T5 | demo |
| T7 | Pruebas manuales (§7), setup de celulares (§8) y ensayo | T6 | DoD |

---

## 11. Definición de terminado

- [ ] `database/Notificaciones(v.001).sql` y `Diagrama_ER.png` actualizados.
- [ ] Depósitos y transferencias (enviadas y recibidas) generan su notificación en la misma transacción.
- [ ] El push sale solo después del commit y, si falla, no afecta la operación.
- [ ] Endpoints protegidos por rol `Usuario`, filtrados por el usuario del token y documentados en Swagger y Apidog.
- [ ] Campana con globito (`9+`), panel ordenado, marcar una y marcar todas, en desktop y en celular.
- [ ] Estados de carga, vacío y error en el panel.
- [ ] Casos 1 a 12 verificados; guion de la demo ensayado en dos celulares.
- [ ] Sin conexiones duplicadas al navegar, cerrar sesión o volver a entrar.
- [ ] PR a `dev` sin romper los flujos existentes (`npm test`, `npm run lint` y los checks del backend en verde).
