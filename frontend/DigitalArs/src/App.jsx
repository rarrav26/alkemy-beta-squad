import './App.css'

import Header from './components/Header/Header'
import Main from './components/Main/Main'
import Footer from './components/Footer/Footer'

import Box from '@mui/material/Box'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

import { useContext } from 'react'
import { ElementosGlobales } from './context/ElementosGlobales'
import ScrollTopButton from './components/Home/ScrollTopButton'
import EncabezadoMobile from './components/Navegacion/EncabezadoMobile'
import BarraInferior from './components/Navegacion/BarraInferior'
import useNavegacionMobile from './hooks/useNavegacionMobile'

// Deja lugar abajo para que la barra inferior fija (y el botón de QR que sobresale) no tape el
// final de la página.
const ESPACIO_DE_LA_BARRA_INFERIOR = 'calc(88px + env(safe-area-inset-bottom))'

// Arma la estructura de la página. Está separado de App porque necesita leer el tema propio
// (los breakpoints de useNavegacionMobile), y ese tema recién existe DENTRO del ThemeProvider.
function EstructuraDeLaPagina() {
  const usaNavegacionMobile = useNavegacionMobile()

  if (usaNavegacionMobile) {
    return (
      <>
        <EncabezadoMobile />

        <Box sx={{ pb: ESPACIO_DE_LA_BARRA_INFERIOR }}>
          <Main />
        </Box>

        <BarraInferior />
      </>
    )
  }

  return (
    <>
      <Header />

      <Main />

      <Footer />
      <ScrollTopButton />
    </>
  )
}

function App() {
  const { theme } = useContext(ElementosGlobales)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <EstructuraDeLaPagina />
    </ThemeProvider>
  )
}

export default App
