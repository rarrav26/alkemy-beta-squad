import { useState } from 'react'

import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Fab from '@mui/material/Fab'
import Paper from '@mui/material/Paper'
import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'
import HomeRounded from '@mui/icons-material/HomeRounded'
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded'
import QrCodeScannerRounded from '@mui/icons-material/QrCodeScannerRounded'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  SECCION_CUENTAS,
  SECCION_INICIO,
  SECCION_MAS,
  SECCION_TARJETAS,
  seccionActivaDeLaRuta
} from '../../routes/navegacionUtils'
import AvisoProximamente from '../Proximamente/AvisoProximamente'
import MenuMas from './MenuMas'

// Valor del hueco central. No es una sección: nunca se marca ni navega a ningún lado.
const HUECO_DEL_BOTON_QR = 'hueco-del-boton-qr'

// Barra de navegación fija abajo, con el botón de QR flotando en el centro. Solo se muestra en
// mobile y para el usuario regular (ver useNavegacionMobile). El QR todavía no existe en la
// app: responde con el aviso "Próximamente".
export default function BarraInferior() {
  const ubicacion = useLocation()
  const navegar = useNavigate()
  const [menuMasAbierto, setMenuMasAbierto] = useState(false)
  const [avisoAbierto, setAvisoAbierto] = useState(false)

  const seccionActiva = seccionActivaDeLaRuta(ubicacion.pathname)

  function mostrarAviso() {
    setAvisoAbierto(true)
  }

  function elegirSeccion(_event, seccion) {
    if (seccion === SECCION_INICIO) {
      navegar('/dashboard')
      return
    }

    if (seccion === SECCION_CUENTAS) {
      navegar('/cuentas')
      return
    }

    if (seccion === SECCION_TARJETAS) {
      navegar('/tarjetas')
      return
    }

    if (seccion === SECCION_MAS) {
      setMenuMasAbierto(true)
      return
    }

    mostrarAviso()
  }

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 'appBar',
        pb: 'env(safe-area-inset-bottom)'
      }}
    >
      <BottomNavigation
        component="nav"
        aria-label="Navegación principal"
        showLabels
        value={seccionActiva}
        onChange={elegirSeccion}
        // MUI les da 80px de ancho mínimo a las acciones: con 5 (contando el hueco del QR)
        // suman 400px y en un teléfono de 360–375px la última ("Más") quedaba cortada. Sin
        // mínimo, se reparten el ancho disponible en partes iguales.
        sx={{ '& .MuiBottomNavigationAction-root': { minWidth: 0, px: 0.5 } }}
      >
        <BottomNavigationAction label="Inicio" value={SECCION_INICIO} icon={<HomeRounded />} />
        <BottomNavigationAction label="Cuentas" value={SECCION_CUENTAS} icon={<AccountBalanceRounded />} />

        {/* Reserva el lugar del botón de QR para que no tape "Cuentas" ni "Tarjetas". Tiene que
            ser un BottomNavigationAction: BottomNavigation les pasa props propias a todos sus
            hijos, y un Box común las mandaría al HTML y React avisaría del error. */}
        <BottomNavigationAction
          value={HUECO_DEL_BOTON_QR}
          disabled
          tabIndex={-1}
          aria-hidden="true"
          sx={{ visibility: 'hidden' }}
        />

        <BottomNavigationAction label="Tarjetas" value={SECCION_TARJETAS} icon={<CreditCardRounded />} />
        <BottomNavigationAction label="Más" value={SECCION_MAS} icon={<MoreHorizRounded />} />
      </BottomNavigation>

      <Fab
        color="primary"
        aria-label="Escanear código QR"
        onClick={mostrarAviso}
        sx={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)' }}
      >
        <QrCodeScannerRounded />
      </Fab>

      <MenuMas open={menuMasAbierto} onClose={() => setMenuMasAbierto(false)} />
      <AvisoProximamente open={avisoAbierto} onClose={() => setAvisoAbierto(false)} />
    </Paper>
  )
}
