import { useContext } from 'react'

import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { ElementosGlobales } from '../../context/ElementosGlobales'
import useShell from '../../hooks/useShell'
import { SHELL_CLASICO } from '../../routes/shellUtils'
import LightRays from './LightRays'
import SideRays from './SideRays'

// La configuración de SideRays, copiada del playground de React Bits tal como quedó al probarla.
// En un objeto y con los nombres del componente para que se pueda comparar fila por fila con los
// controles de la página, que es de donde salieron estos números.
//
// Dos que conviene entender antes de tocarlos, porque no significan lo obvio:
//
// `blend` en 1 — el shader dibuja DOS juegos de rayos y los mezcla así:
//     color = rays1 * (1 - blend) + rays2 * blend
//   con blend en 1, rays1 desaparece del todo y se ve SOLO rays2. Y rays2 avanza a `speed * 0.2`,
//   no a `speed`: la velocidad efectiva de lo que se ve es 5 * 0.2 = 1, un ciclo cada ~6 segundos.
//   O sea que `speed` en 5 no es tan rápido como parece, y bajarlo frena el doble de lo esperado.
//   (Al pesar 0, `rayColor1` ya no pinta nada; se sigue pasando por si mañana blend cambia.)
//
// `falloff` en 0.9 — es el LARGO de los rayos, aunque no se llame así: el brillo cae como
//     intensity * 0.4 / distancia^falloff
//   Con el 1.6 que trae por omisión se desploma y los rayos mueren cerca de su origen; a 0.9 la
//   caída se aplana y cruzan la pantalla. `spread` es otra cosa: abre el ABANICO, no el largo.
const CONFIGURACION_DE_SIDE_RAYS = {
  speed: 5,
  intensity: 3,
  spread: 2.1,
  tilt: -57,
  saturation: 2,
  blend: 1,
  falloff: 0.9
}

// La opacidad es el único valor que NO se copia del playground, y por dos motivos distintos.
//
// En modo noche el playground tiene 1, pero ahí el efecto se ve solo: acá tiene un saldo y listas
// de movimientos encima, y a opacidad plena el rayo del costado competía con lo que hay que leer.
// 0.6 lo deja presente sin pelear. Es el número para mover si querés más o menos presencia.
//
// En modo día es más bajo todavía: los rayos son luz que se SUMA, y sobre un fondo casi blanco
// lavan la pantalla en vez de iluminarla. Ahí cambia el medio, no el gusto.
const OPACIDAD_DE_NOCHE = 0.6
const OPACIDAD_DE_DIA = 0.15

// Cuánto se estiran los rayos del login. Acá sí hay una prop directa, porque LightRays está
// pensado con otro modelo. 3 cruza la pantalla entera; su valor por omisión es 2.
const LARGO_DE_LOS_RAYOS_DEL_LOGIN = 3

// El fondo de toda la app, detrás de todo el contenido.
//
// Dos fondos distintos, elegidos por la misma fuente que decide la navegación (useShell):
//
//   - En login y registro va LightRays, que sale de arriba al centro y sigue al puntero. Es la
//     primera pantalla que alguien ve y no tiene datos que leer encima, así que puede ser más
//     protagonista.
//   - En la app va SideRays, entrando desde un costado: deja el centro tranquilo, que es donde
//     están el saldo y las listas.
//
// Los dos dibujan con WebGL a través de `ogl`.
export default function FondoDelSitio() {
  const { darkMode } = useContext(ElementosGlobales)
  const theme = useTheme()
  const shell = useShell()

  // Un fondo animado permanente es justo el tipo de movimiento que molesta a quien pidió menos:
  // no se puede apagar mirando para otro lado, porque está atrás de todo lo que lee. Acá no se
  // dibuja nada — ni se crea el contexto de WebGL.
  const quiereMenosMovimiento = useMediaQuery('(prefers-reduced-motion: reduce)')
  if (quiereMenosMovimiento) return null

  // La cáscara clásica quedó siendo solo la de las pantallas públicas: con sesión verificada
  // siempre gana mobile o escritorio (ver shellUtils).
  const esPantallaPublica = shell === SHELL_CLASICO

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        // zIndex 0 y el contenido de la app en 1 (ver App.jsx). Se podría usar -1 y no tocar el
        // contenido, pero un z-index negativo puede terminar detrás del fondo del body según
        // quién tenga el color, y el resultado es un fondo que simplemente no aparece. Con dos
        // capas explícitas no depende de eso.
        zIndex: 0,
        // El contenedor de los dos componentes ya lo trae, pero se repite acá porque esta caja es
        // la que cubre toda la pantalla: si capturara el puntero, no se podría tocar nada.
        pointerEvents: 'none'
      }}
    >
      {esPantallaPublica ? (
        <LightRays
          raysOrigin="top-center"
          // El MISMO color que los rayos de la app (ver abajo): es `primary.main`, el celeste del
          // tema, así que el login y el dashboard se sienten la misma aplicación.
          raysColor={theme.palette.primary.main}
          rayLength={LARGO_DE_LOS_RAYOS_DEL_LOGIN}
          // Este componente sí resuelve el modo día por su cuenta: con `lightMode` invierte el
          // cálculo y dibuja los rayos como tinta oscura sobre claro, en vez de luz que se suma.
          // Es lo correcto sobre un fondo casi blanco, donde sumar luz no se ve.
          lightMode={!darkMode}
        />
      ) : (
        <SideRays
          origin="top-right"
          // Los DOS juegos de rayos van del mismo color, y es el mismo que usa el login.
          //
          // Antes el segundo era `primary.dark`, buscando profundidad, y salió mal por la mezcla:
          // `primary.dark` no es el celeste más oscuro — MUI lo deriva desaturando, así que en modo
          // noche es rgb(84, 128, 178), un azul grisáceo. Con el peso que le daba `blend`, la app
          // se veía gris y el login celeste, con el mismo tema.
          //
          // Y sale del tema, no del componente: sus valores por omisión son un amarillo y un
          // celeste que no tienen nada que ver con la paleta, y es exactamente así como un
          // componente traído de afuera se ve pegoteado.
          rayColor1={theme.palette.primary.main}
          rayColor2={theme.palette.primary.main}
          {...CONFIGURACION_DE_SIDE_RAYS}
          opacity={darkMode ? OPACIDAD_DE_NOCHE : OPACIDAD_DE_DIA}
        />
      )}
    </Box>
  )
}
