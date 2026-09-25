import { createContext, useMemo, useState } from 'react'
import { createTheme } from '@mui/material/styles'
import { apariciones, CURVA_DE_SALIDA, DURACION_DE_APARICION } from '../components/Comunes/transiciones'

// eslint-disable-next-line react-refresh/only-export-components
export const ElementosGlobales = createContext({})

export default function ElementosGlobalesProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true)

  // Todos los colores de superficie viven acá. Antes cada pantalla repetía sus propios
  // hexadecimales con un ternario sobre darkMode, así que un ajuste de tono había que
  // replicarlo en cada archivo y cualquier olvido se veía como una sección de otro color.
  // Definidos en la paleta, los componentes los piden por nombre ('background.paper') y el
  // cambio de tema los resuelve solo.
  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: darkMode ? '#78b8ff' : '#1761ac' },
      background: {
        default: darkMode ? '#0d1117' : '#f8fafc',
        paper: darkMode ? '#161b22' : '#ffffff'
      },
      text: {
        primary: darkMode ? '#e6edf3' : '#111827',
        secondary: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(17,24,39,0.6)'
      },
      // Superficies propias de la app que no tienen un equivalente en la paleta de MUI.
      superficies: {
        // El encabezado de tabla es oscuro en los dos modos: su texto va siempre en blanco.
        // Traslúcido, pero bastante opaco: se apoya sobre el vidrio de su contenedor, así que
        // lo que se adivina detrás ya viene difuminado y el blanco conserva su contraste.
        encabezadoTabla: darkMode ? 'rgba(33, 38, 45, 0.82)' : 'rgba(30, 41, 59, 0.82)',

        // Intercalado de las filas de la tabla y de las tarjetas. Es un TINTE que se apoya
        // encima de la superficie, no un color que la reemplaza: con un tono opaco, la mitad
        // de las filas quedaban como parches sólidos sobre un contenedor de vidrio y los rayos
        // desaparecían justo ahí. Las dos vistas usan el mismo, así la lista se lee igual en
        // cualquier ancho de pantalla.
        tinteAlterno: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(17, 24, 39, 0.04)',

        // VIDRIO: los mismos tonos que background.paper pero traslúcidos, para que los rayos de
        // luz del fondo se vean pasar por detrás de las tarjetas.
        //
        // La opacidad es alta a propósito. Con menos se ven más los rayos, pero el texto queda
        // sobre un fondo que se MUEVE, y leer un saldo encima de eso cansa — no es solo contraste,
        // es que el ojo persigue el movimiento. A este nivel se adivina la luz sin que compita.
        vidrio: darkMode ? 'rgba(22, 27, 34, 0.72)' : 'rgba(255, 255, 255, 0.78)',

        // Las barras de navegación van más opacas que las tarjetas: están fijas y el contenido les
        // pasa por debajo al scrollear, así que con poca opacidad se ve el texto de la página
        // desfilando atrás de las etiquetas.
        vidrioDeNavegacion: darkMode ? 'rgba(22, 27, 34, 0.88)' : 'rgba(255, 255, 255, 0.9)',

        // Superficies FLOTANTES: diálogos y hojas inferiores. Van más opacas todavía, y encima
        // llevan un difuminado más fuerte, porque lo que tienen detrás no es el fondo de rayos
        // sino la PÁGINA con sus textos y sus números. Lo que las hace legibles igual es que el
        // velo de atrás también se difumina (ver MuiBackdrop): la página queda como un lavado de
        // color, así que a través del diálogo se adivina luz y no palabras.
        vidrioFlotante: darkMode ? 'rgba(22, 27, 34, 0.86)' : 'rgba(255, 255, 255, 0.88)',
        difuminadoFlotante: 'blur(24px)',

        // Difuminado del velo que cubre la página cuando se abre un diálogo. Es lo que convierte
        // la translucidez en un efecto y no en un problema de lectura.
        difuminadoDelVelo: 'blur(6px)',

        // El desenfoque es lo que hace que esto funcione: sin él, los rayos cruzan como franjas
        // nítidas por atrás de las palabras. Difuminados se convierten en un resplandor suave, que
        // es la diferencia entre un efecto de vidrio y un fondo que estorba.
        difuminado: 'blur(12px)'
      }
    },
    shape: { borderRadius: 12 },
    typography: { fontFamily: 'Inter, system-ui, sans-serif' },
    components: {
      // Las superficies de CONTENIDO pasan a vidrio. Se apunta al slot `outlined` y no a `root` a
      // propósito, y eso es lo que decide a quién alcanza:
      //
      //   SÍ  — las tarjetas y paneles de la app, que todos se escriben `variant="outlined"`
      //         (saldo, movimientos, gestión, el formulario de login, el perfil…).
      //   NO  — los menús, popovers y desplegables de select, que MUI dibuja con `elevation`.
      //         Flotan encima del contenido y su velo es INVISIBLE (Popover fuerza
      //         `invisible: true`), así que nada difumina lo que tienen detrás: ahí la
      //         translucidez no sería estética sino un error de legibilidad, se leería el texto
      //         de la página atrás de las opciones del menú. Los diálogos sí van de vidrio, pero
      //         con su propia receta más opaca (ver MuiDialog), porque su velo sí se difumina.
      //   NO  — la promo de crédito, que va con `elevation={0}` y tiene su propio degradé.
      //
      // Es decir: el propio criterio de MUI para "superficie de contenido" hace de filtro, y no
      // hay que mantener una lista de excepciones a mano.
      MuiPaper: {
        styleOverrides: {
          outlined: ({ theme: tema }) => ({
            backgroundColor: tema.palette.superficies.vidrio,
            backdropFilter: tema.palette.superficies.difuminado,
            // Safari todavía lo pide con prefijo; sin esto, en iPhone las tarjetas quedan
            // traslúcidas pero SIN difuminar, que es el caso ilegible.
            WebkitBackdropFilter: tema.palette.superficies.difuminado
          })
        }
      },
      // Los DIÁLOGOS pasan a vidrio. Va en `MuiDialog.paper` y no en `MuiPaper`, porque el papel
      // de un diálogo es la variante `elevation` y meterla en MuiPaper alcanzaría también a los
      // menús, que no tienen velo que difuminar.
      //
      // Verificado en el código de MUI antes de escribirlo: `DialogPaper` se declara con
      // `overridesResolver`, así que este override sí se aplica. `DrawerPaper` NO lo tiene, por eso
      // las hojas inferiores llevan su vidrio en el propio componente y no acá -- puesto en el tema
      // se ignoraría en silencio, que es la trampa que este proyecto ya se comió dos veces.
      MuiDialog: {
        defaultProps: {
          transitionDuration: { enter: DURACION_DE_APARICION, exit: 180 },
          slotProps: { transition: { easing: { enter: CURVA_DE_SALIDA } } }
        },
        styleOverrides: {
          paper: ({ theme: tema }) => ({
            // La superficie entra suavemente; MUI conserva el cierre y el manejo del foco.
            ...apariciones(),
            backgroundColor: tema.palette.superficies.vidrioFlotante,
            backdropFilter: tema.palette.superficies.difuminadoFlotante,
            WebkitBackdropFilter: tema.palette.superficies.difuminadoFlotante,
            // MUI le suma a todo Paper con elevación un degradé blanco en modo oscuro
            // (`--Paper-overlay`). Sobre un fondo traslúcido ese degradé lo vuelve a tapar, así
            // que la elevación queda solo como SOMBRA, que es para lo que la queremos.
            backgroundImage: 'none',
            // El borde es lo que hace que el vidrio se lea como una superficie con canto y no
            // como una mancha: sin él, un panel traslúcido sobre un fondo difuminado no tiene
            // dónde empezar.
            border: `1px solid ${tema.palette.divider}`
          })
        }
      },
      // El velo que cubre la página detrás de un diálogo se difumina. Esta es la pieza que hace
      // legible todo lo anterior: sin ella, un diálogo traslúcido deja leer los números de la
      // página por detrás de su propio texto.
      //
      // El guard del velo INVISIBLE no es opcional: Popover (y por lo tanto Menu, Select y la
      // campana de notificaciones) monta su velo con `invisible: true`, que solo le quita el
      // color. El difuminado se aplicaría igual, así que abrir un menú difuminaría la pantalla
      // entera sin ningún velo visible que lo justifique.
      MuiBackdrop: {
        styleOverrides: {
          root: ({ theme: tema }) => ({
            backdropFilter: tema.palette.superficies.difuminadoDelVelo,
            WebkitBackdropFilter: tema.palette.superficies.difuminadoDelVelo,
            '&.MuiBackdrop-invisible': {
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none'
            }
          })
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          input: {
            // Chrome y Edge pintan con su propio celeste los campos que autocompletan, y ese
            // color ignora el tema: en modo oscuro los inputs quedaban azules con el texto
            // casi ilegible, como si estuvieran deshabilitados. El fondo del autofill no se
            // puede cambiar con background-color, así que se tapa con una sombra interior
            // enorme, que es la técnica que sí respeta el navegador. La transición larguísima
            // evita que el celeste aparezca por un instante antes de taparse.
            '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active': {
              WebkitBoxShadow: `0 0 0 100px ${darkMode ? '#161b22' : '#ffffff'} inset`,
              WebkitTextFillColor: darkMode ? '#e6edf3' : '#111827',
              caretColor: darkMode ? '#e6edf3' : '#111827',
              borderRadius: 'inherit',
              transition: 'background-color 9999s ease-in-out 0s'
            }
          }
        }
      }
    }
  }), [darkMode])

  return <ElementosGlobales.Provider value={{ darkMode, setDarkMode, theme }}>
    {children}
  </ElementosGlobales.Provider>
}
