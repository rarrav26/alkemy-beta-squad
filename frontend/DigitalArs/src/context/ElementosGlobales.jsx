import { createContext, useMemo, useState } from 'react'
import { createTheme } from '@mui/material/styles'

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
        encabezadoTabla: darkMode ? '#21262d' : '#1e293b',
        // Fondo intercalado de las filas de la tabla y de las tarjetas: las dos vistas usan
        // este mismo par de tonos contra background.paper, así la lista se lee igual en
        // cualquier ancho de pantalla.
        filaAlterna: darkMode ? '#1b2129' : '#f4f6f8'
      }
    },
    shape: { borderRadius: 12 },
    typography: { fontFamily: 'Inter, system-ui, sans-serif' },
    components: {
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
