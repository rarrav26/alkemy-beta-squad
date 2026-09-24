# Spec — Home (estilo Naranja X) · DigitalArs Billetera Virtual

> Sugerencia de ubicación en el repo: `docs/frontend/home-spec.md`
> Rama sugerida: `feature/ux-home-mui-reactbits` (desde `dev`, según el flujo del repo)

## 0. Decisiones ya tomadas (contexto, no repetir la discusión)

- **Un solo sistema de diseño: MUI.** No se incorpora shadcn/ui ni Tailwind CSS en esta pantalla. El preflight de Tailwind pisa los estilos de MUI (conflicto documentado) y shadcn duplicaría componentes que MUI ya resuelve.
- **react-bits solo en variante CSS (JS+CSS o TS+CSS), nunca la variante Tailwind.** Así no hace falta instalar Tailwind para nada.
- **Instalación de componentes de react-bits: copia manual, no vía CLI.** La CLI recomendada por react-bits (`npx shadcn@latest add @react-bits/...`) depende de tener el CLI de shadcn inicializado (que a su vez pide Tailwind). Como no vamos a inicializar shadcn, la vía correcta es entrar a [reactbits.dev](https://reactbits.dev), elegir el componente, seleccionar las pestañas **TS** y **CSS** (no TW), y copiar el código a mano al proyecto.
- **Iconos: `@mui/icons-material`, un solo tema visual para todo el Home** (recomendado `Rounded` u `Outlined`, no el `Filled` por defecto — se parece más a la referencia). Definir cuál y no mezclar.
- **El MCP de shadcn ya instalado (`npx shadcn@latest mcp init --client claude`) no se usa en este spec.** Queda instalado sin problema, pero no se lo invoca para nada de lo que sigue.
- **Alcance:** solo la pantalla Home (Imagen 1 de referencia). Cuentas y Tarjetas quedan para specs separados, aunque varios componentes de acá (`BottomNav`, `BalanceCard`) se van a reutilizar ahí.
- **No hay cambios de backend ni de lógica de negocio en este spec.** Es una capa de presentación que consume datos que la API ya expone (saldo, alias/CVU, nombre de usuario).

---

## 0.1 Adaptación al proyecto DigitalArs (prevalece sobre el resto del spec)

Revisado contra el código real. Donde esta sección contradice al resto del documento, manda esta.

**Lo que el spec asumía y no es así:**

- El frontend vive en `frontend/DigitalArs/`, no en `frontend/`. Es Vite + React 19 en **JSX, sin TypeScript**. De react-bits correspondería la variante **JS+CSS**, no TS+CSS.
- No existe `theme/theme.js`. El tema se arma en `src/context/ElementosGlobales.jsx` y el `ThemeProvider` se monta en `src/App.jsx`. Arranca en modo oscuro.
- La versión es **MUI 9**:
  - `Grid item xs={3}` ya no existe. La grilla de atajos se arma con `Box` y CSS grid (`gridTemplateColumns: 'repeat(4, 1fr)'`).
  - `Typography` ignora sin avisar `fontWeight` como prop, y en `color` solo acepta nombres sueltos. Los dos van por `sx`.
- El Home del usuario regular es `/dashboard`, en `src/routes/Dashboard.jsx`.
- La API expone **una sola cuenta en pesos**: `GET /api/cuentas/me` → `{ id, alias, cvu, saldo }`. No hay cuenta en USD, tarjeta de crédito, % de rendimiento ni promos.
- El saldo ya se anima con `src/components/Cuentas/SaldoAnimado.jsx` (NumberFlow, respeta `prefers-reduced-motion`). **No se usa react-bits `CountUp`**, y la skill de react-bits no está instalada.
- La campana ya existe y funciona en tiempo real: `src/components/Notificaciones/CampanaDeNotificaciones.jsx`. Se reutiliza tal cual.

**Decisiones:**

1. **AccountsPeek (USD), CreditPromoCard, PromoBanner y el badge de variación** se construyen como **mock visual marcado "Próximamente"**. Todos los datos falsos viven en un único archivo, `components/Inicio/datosDeMuestra.js`.
2. **Shell mobile.** Por debajo de `md`, y solo para un usuario regular con sesión activa, el header y la barra inferior nuevos reemplazan al AppBar global, el Footer y el ScrollTopButton. En desktop y para el administrador no cambia nada.
3. **Barra inferior.** Replica la referencia: Inicio, Cuentas, Fab QR, Tarjetas y Más.
   - Inicio va a `/dashboard`.
   - Más abre un menú con Movimientos, Perfil y Cerrar sesión, así esas rutas siguen accesibles sin el AppBar.
   - Cuentas, Tarjetas y QR avisan "Próximamente".
4. **Nombres en español**, como el resto del proyecto.
5. **Íconos:** variante **`Rounded`** en todo el Home. `Movimientos` ya la usa.

**Mapeo de nombres del spec a nombres del proyecto:**

| Spec                          | Proyecto                                        |
|-------------------------------|-------------------------------------------------|
| `AppHeader`                   | `components/Navegacion/EncabezadoMobile.jsx`    |
| `BottomNav`                   | `components/Navegacion/BarraInferior.jsx` (+ `MenuMas.jsx`) |
| `HomeScreen`                  | `components/Inicio/InicioMobile.jsx`            |
| `BalanceCard`                 | `components/Inicio/TarjetaDeSaldo.jsx`          |
| `AccountsPeek`                | `components/Inicio/CuentasEnOtrasMonedas.jsx`   |
| `ShortcutsGrid` / `ShortcutItem` | `components/Inicio/GrillaDeAtajos.jsx` / `Atajo.jsx` |
| `CreditPromoCard`             | `components/Inicio/PromoCredito.jsx`            |
| `PromoBanner`                 | `components/Inicio/BannerPromocional.jsx`       |
| `useBalanceVisibility`        | `hooks/useSaldoVisible.js`                      |
| —                             | `hooks/useMiCuenta.js` (carga de la cuenta, extraída de `Dashboard.jsx`) |
| —                             | `hooks/useNavegacionMobile.js` (decide si se usa el shell mobile) |
| —                             | `components/Cuentas/AliasYCvuDialog.jsx` (acción "Alias y CVU") |
| `animations/CountUp.jsx`      | no se crea: se usa `SaldoAnimado`               |

**Orden de implementación adaptado.** Los datos ya existen, así que la tarjeta de saldo se conecta a la API desde el principio y no hace falta un paso de mock previo.

- 0 — Esta sección.
- 1 — Base compartida sin cambios visuales: `esSesionActiva` en `rolesUtils.js` (con su test), `useNavegacionMobile` y `useMiCuenta`.
- 2 — Shell mobile: `EncabezadoMobile`, `BarraInferior`, `MenuMas` y el cambio en `App.jsx`.
- 3 — `InicioMobile` + `TarjetaDeSaldo` con datos reales y las acciones Agregar / Transferir / Alias y CVU.
- 4 — Toggle de saldo con `useSaldoVisible`.
- 5 — `GrillaDeAtajos`: 4 atajos reales y 4 mock.
- 6 — Mocks marcados: USD, crédito, banner y badge de variación.
- 7 — Pulido: el saldo "sube" al revelarse, con NumberFlow.
- 8 — Revisión final: 360–414px, ambos temas, accesibilidad, y confirmar que desktop y admin no cambiaron.

---

## 1. Prerrequisitos antes de escribir el primer componente

- [x] Confirmar que `ThemeProvider` (con los dos temas, día/noche) ya envuelve toda la app: está en `src/App.jsx`, y el tema en `src/context/ElementosGlobales.jsx`.
- [x] Completar la tabla de tokens de color (sección 1.1) copiando los valores reales de tu archivo de theme actual.
- [x] Elegir el tema de íconos (`Outlined` o `Rounded`) y anotarlo acá cuando se decida: `Rounded`
- [x] Confirmar instalado: `@mui/icons-material @mui/material @emotion/react @emotion/styled` (todos en 9.3.x / 11.14.x)
- [ ] ~~Confirmar que la skill de react-bits está en `.claude/skills/`~~: no está instalada, y no hace falta (ver 0.1).

### 1.1 Tokens de color a completar (no hardcodear hex en ningún componente)

| Rol semántico              | Token MUI                  | Valor actual (noche / día)                         | Dónde se usa en el Home                      |
|-----------------------------|-----------------------------|-----------------------------------------------------|-----------------------------------------------|
| Color de marca / principal  | `palette.primary.main`      | `#78b8ff` / `#1761ac`                               | Botón central del bottom nav, íconos activos |
| Superficie de card          | `palette.background.paper`  | `#161b22` / `#ffffff`                               | BalanceCard, tarjetas del grid de atajos      |
| Fondo de pantalla           | `palette.background.default`| `#0d1117` / `#f8fafc`                               | Fondo general del Home                        |
| Éxito / variación positiva  | `palette.success.main`      | default de MUI: `#66bb6a` / `#2e7d32`               | Badge "+19%"                                  |
| Texto secundario            | `palette.text.secondary`    | `rgba(255,255,255,0.6)` / `rgba(17,24,39,0.6)`      | Labels debajo de íconos, subtítulos           |
| Divisor                     | `palette.divider`           | default de MUI: `rgba(255,255,255,0.12)` / `rgba(0,0,0,0.12)` | Separadores de lista (reutilizable en Cuentas)|
| Radio de bordes             | `shape.borderRadius`        | `12` (los dos modos)                                | Cards del Home                                |

Los valores salen de `src/context/ElementosGlobales.jsx`. Arriba se listan solo como referencia: en el código se piden por nombre del token.

Todo componente de este spec debe leer estos valores vía `theme.palette.*` o `sx={{ color: 'primary.main' }}` — nunca un `#hexcode` suelto en el JSX.

---

## 2. Inventario de componentes (derivado de la Imagen 1: Home)

| # | Componente          | Qué muestra                                                        | Base MUI                              | react-bits (opcional, recién en el paso 7) |
|---|----------------------|---------------------------------------------------------------------|----------------------------------------|----------------------------------------------|
| 1 | `AppHeader`          | Saludo + nombre, campana de notificaciones, botón "Ayuda"           | `AppBar`, `Toolbar`, `IconButton`, `Chip`/`Button` | — |
| 2 | `BalanceCard`        | Cuenta en pesos, badge de rendimiento, saldo oculto/visible, 3 acciones | `Card`, `Chip`, `IconButton`, `Stack`, `Avatar` | `CountUp` al revelar el saldo |
| 3 | `AccountsPeek`       | Preview con scroll horizontal de otra cuenta (ej. USD)              | `Stack` horizontal con `overflow-x: auto` | — |
| 4 | `ShortcutsGrid`      | Grid 2×4 "Tus atajos" con íconos y badges de promo                  | `Grid`/`Box`, `Avatar`, `Badge`        | leve `scale` al presionar (CSS, no hace falta lib) |
| 5 | `CreditPromoCard`    | "Qué lindo es poder" — disponible de tarjeta de crédito             | `Card` con fondo en degradé usando tokens de color | — |
| 6 | `PromoBanner`        | Banner promocional horizontal                                       | `Card`                                  | — |
| 7 | `BottomNav`          | Navegación inferior + botón flotante central                        | `BottomNavigation`, `BottomNavigationAction`, `Fab` | — |

---

## 3. Estructura de carpetas propuesta

```
frontend/src/
├── theme/
│   └── theme.js                 # ya existente — no se toca en este spec salvo para confirmar tokens
├── components/
│   ├── layout/
│   │   ├── AppHeader.jsx
│   │   └── BottomNav.jsx
│   └── home/
│       ├── HomeScreen.jsx       # arma el layout general, importa el resto
│       ├── BalanceCard.jsx
│       ├── AccountsPeek.jsx
│       ├── ShortcutsGrid.jsx
│       ├── ShortcutItem.jsx     # ítem individual reutilizado por el grid
│       ├── CreditPromoCard.jsx
│       └── PromoBanner.jsx
├── hooks/
│   └── useBalanceVisibility.js  # toggle mostrar/ocultar saldo
└── animations/                  # componentes copiados de react-bits (variante CSS)
    └── CountUp.jsx              # se agrega recién en el paso 7
```

---

## 4. Detalle por componente

### 4.1 `AppHeader`
- **Props:** `userName: string`
- **Piezas MUI:** `Toolbar` con `justifyContent: 'space-between'`; texto "Nos encanta verte," + `userName` en dos pesos tipográficos distintos (`Typography variant="body2"` + `Typography variant="h6"`); `IconButton` con ícono de campana; `Button` variant `outlined` en forma de pill para "Ayuda".
- **Estado:** ninguno propio (el conteo de notificaciones, si existe, se pasa por prop).
- **Accesibilidad:** `aria-label="Notificaciones"` en el IconButton de la campana.

### 4.2 `BalanceCard`
- **Props:** `balance: number`, `variationPct: number`, `onAdd`, `onTransfer`, `onAliasClick`
- **Estado propio:** `visible: boolean` (default `false`, igual que la referencia que arranca oculta) vía el hook `useBalanceVisibility`.
- **Piezas MUI:** `Card` con `borderRadius` generoso (token del theme, no un número mágico repetido en cada componente — definirlo una vez en `theme.shape.borderRadius`); `Chip` color `success` para el badge de variación; `IconButton` con ícono de ojo (`VisibilityOutlined` / `VisibilityOffOutlined`) para el toggle; fila de 3 `Stack` con `Avatar` + `Typography` para Agregar / Transferir / Alias y CVU.
- **Lógica del toggle:** cuando `visible` es `false`, mostrar un texto tipo `"Shh..."` en vez del número; cuando es `true`, mostrar el monto formateado. Esto es estado de React puro, **no necesita react-bits**.
- **Candidato de react-bits (paso 7, opcional):** al pasar de oculto a visible, envolver el número con el componente `CountUp` (categoría "Text Animations" de reactbits.dev) para que el saldo suba animado hasta el valor real en vez de aparecer de golpe.

### 4.3 `ShortcutsGrid` + `ShortcutItem`
- **Props de `ShortcutsGrid`:** `items: Array<{ id, label, icon, badge? }>`
- **Piezas MUI:** `Grid container spacing={2}` con `Grid item xs={3}` (4 columnas) repetido en 2 filas; cada `ShortcutItem` es un `Avatar` circular con el ícono adentro + `Typography variant="caption"` debajo; `Badge` de MUI para el "20%" sobre el ícono de Frascos.
- **Interacción:** al tocar, aplicar `transform: scale(0.95)` en `:active` vía `sx` — esto es CSS puro de MUI, no hace falta ninguna librería de animación para el micro-press.

### 4.4 `BottomNav`
- **Piezas MUI:** `BottomNavigation` con 4 `BottomNavigationAction` (Inicio, Cuentas, Tarjetas, Más) y un `Fab` posicionado por encima del centro de la barra (`position: absolute`, `top: -28px` relativo al contenedor) para el botón de escaneo QR.
- **Nota:** este componente se reutiliza tal cual en Cuentas y Tarjetas — construirlo pensando en eso desde el paso 2, con la navegación activa marcada por ruta (`useLocation` de React Router, si ya lo usan) y no hardcodeada.

---

## 5. Orden de implementación sugerido

Cada paso es chico, revisable y no rompe lo anterior. Pedile a Claude Code un paso a la vez y revisá el diff antes de seguir al siguiente — no le pidas "implementá todo el Home" de una sola vez.

- [ ] **Paso 1 — Layout base + `AppHeader`.** Datos mockeados (nombre fijo). Verificar que se vea bien en modo día y modo noche.
- [ ] **Paso 2 — `BottomNav` fijo con `Fab` central.** Sin lógica de ruteo real todavía si no lo tenés armado; solo visual.
- [ ] **Paso 3 — `BalanceCard` estática**, con el saldo siempre visible (sin el toggle todavía). Conectada a datos mockeados.
- [ ] **Paso 4 — Agregar el toggle mostrar/ocultar** con `useBalanceVisibility` y el ícono de ojo.
- [ ] **Paso 5 — `ShortcutsGrid`** con al menos 4 accesos (no hace falta completar los 8 de la referencia para validar el patrón).
- [ ] **Paso 6 — Conectar `BalanceCard` a datos reales** (el endpoint de saldo/cuenta que ya expone la API).
- [ ] **Paso 7 — Pulido con react-bits.** Recién acá se copia manualmente el componente `CountUp` (variante TS+CSS) desde reactbits.dev y se integra en `BalanceCard`. No antes.
- [ ] **Paso 8 — Revisión final:** responsive en viewport angosto (~360–414px), ambos temas, accesibilidad básica (sección 7).

**Definición de "hecho" por paso:** compila sin warnings nuevos, se ve correcto en modo día y modo noche, no rompe ningún paso anterior, y el diff quedó revisado por vos antes de pasar al siguiente.

---

## 6. Reglas y riesgos a tener presentes

- **No usar componentes de shadcn/ui en esta pantalla.** El MCP queda instalado pero no se invoca acá — si en algún momento Claude Code sugiere traer algo de shadcn "porque está disponible", es una señal de que hay que frenar y revisar, no de que esté bien usarlo.
- **react-bits: solo variante CSS, instalada por copia manual.** Nunca la variante Tailwind (`-TW`), y evitar los componentes que dependen de librerías pesadas (Three.js, Matter.js, GSAP) — para esta pantalla no aportan y suman peso al bundle.
- **Un solo tema de íconos en todo el Home.** Mezclar `Filled` con `Outlined` en la misma pantalla es un error visual común y fácil de evitar si se decide antes de empezar (sección 1).
- **Cero colores hardcodeados.** Todo pasa por los tokens de la tabla 1.1.
- **Mobile-first.** Diseñar y probar primero en un viewport angosto; recién después revisar que no se rompa en pantallas más anchas si la app también corre en desktop.

---

## 7. Checklist de accesibilidad mínima

- [ ] Todo `IconButton` sin texto visible tiene `aria-label` (campana, ojo de mostrar/ocultar saldo, Fab de QR).
- [ ] Contraste de texto sobre fondo cumple WCAG AA en ambos temas (revisar especialmente el texto sobre el `CreditPromoCard` si tiene fondo de color).
- [ ] Íconos puramente decorativos llevan `aria-hidden="true"`.

---

## 8. Referencias

- Iconos MUI: https://mui.com/material-ui/material-icons/
- Theming MUI: https://mui.com/material-ui/customization/theming/
- react-bits (catálogo y variantes de instalación): https://reactbits.dev
- react-bits (repo, licencia MIT + Commons Clause): https://github.com/DavidHDev/react-bits
