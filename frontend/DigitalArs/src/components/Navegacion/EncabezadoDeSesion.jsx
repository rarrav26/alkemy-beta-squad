import { useState } from 'react'

import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'

import { useAuth } from '../../context/authContext'
import { getSessionUser } from '../../routes/dashboardUtils'
import ChangeTheme from '../Header/ChangeTheme'
import CampanaDeNotificaciones from '../Notificaciones/CampanaDeNotificaciones'
import AvisoProximamente from '../Proximamente/AvisoProximamente'

// Encabezado de la vista mobile del usuario regular: reemplaza al AppBar azul de escritorio.
// Va sobre el fondo de la pantalla (color="transparent") para que el protagonista sea la
// tarjeta de saldo, no la barra. La navegación vive en la barra inferior.
export default function EncabezadoMobile() {
  const { session } = useAuth()
  const [avisoAbierto, setAvisoAbierto] = useState(false)

  const nombre = getSessionUser(session)?.nombre ?? 'usuario'

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar sx={{ gap: 0.5 }}>
        {/* minWidth: 0 deja que el nombre se corte con "…" en vez de empujar los botones
            fuera de la pantalla cuando es largo. */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nos encanta verte,
          </Typography>
          <Typography component="p" variant="h6" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {nombre}
          </Typography>
        </Box>

        <CampanaDeNotificaciones />
        <ChangeTheme />

        <Button
          variant="outlined"
          size="small"
          startIcon={<HelpOutlineRounded aria-hidden="true" />}
          onClick={() => setAvisoAbierto(true)}
          sx={{ borderRadius: 999, ml: 0.5, flexShrink: 0 }}
        >
          Ayuda
        </Button>
      </Toolbar>

      <AvisoProximamente open={avisoAbierto} onClose={() => setAvisoAbierto(false)} />
    </AppBar>
  )
}
