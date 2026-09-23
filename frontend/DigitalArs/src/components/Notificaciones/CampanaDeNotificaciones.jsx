import { useState } from 'react'

import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import NotificationsIcon from '@mui/icons-material/Notifications'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { useNotificaciones } from '../../context/notificacionesContext'
import ListaDeNotificaciones from './ListaDeNotificaciones'

// El globito muestra hasta 9; con 10 o más, MUI lo dibuja como "9+". Con 0 lo esconde solo.
const TOPE_DEL_GLOBITO = 9

function etiquetaDelBoton(noLeidas) {
  if (noLeidas === 0) return 'Notificaciones'
  if (noLeidas === 1) return 'Notificaciones, 1 sin leer'
  return `Notificaciones, ${noLeidas} sin leer`
}

export default function CampanaDeNotificaciones() {
  const { noLeidas, marcarTodasLeidas } = useNotificaciones()
  const [ancla, setAncla] = useState(null)

  const theme = useTheme()
  // Mismo mecanismo que usa UsuariosAdmin para elegir entre tarjetas y tabla.
  const esPantallaChica = useMediaQuery(theme.breakpoints.down('md'))

  const abierto = Boolean(ancla)

  const abrir = event => setAncla(event.currentTarget)
  const cerrar = () => setAncla(null)

  // El mismo contenido para las dos presentaciones: lo único que cambia es el envase.
  const panel = (
    <>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 2, py: 1.5 }}
      >
        <Typography component="h2" fontWeight={700}>
          Notificaciones
        </Typography>

        {/* Con texto y no como ícono con tooltip: en una pantalla táctil no hay hover, así que
            un tooltip nunca aparece. Es el mismo criterio que sigue UsuariosAdmin. */}
        <Button size="small" onClick={marcarTodasLeidas} disabled={noLeidas === 0}>
          Marcar todas como leídas
        </Button>
      </Stack>

      <Divider />

      <ListaDeNotificaciones />
    </>
  )

  return (
    <>
      <IconButton
        color="inherit"
        onClick={abrir}
        aria-label={etiquetaDelBoton(noLeidas)}
        aria-controls={abierto ? 'panel-notificaciones' : undefined}
        aria-haspopup="true"
        aria-expanded={abierto ? 'true' : undefined}
      >
        <Badge badgeContent={noLeidas} color="error" max={TOPE_DEL_GLOBITO}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* En el teléfono el panel sube desde abajo, que es donde llega el pulgar y donde caben
          filas cómodas. En escritorio se ancla a la campana, que es lo esperable ahí. */}
      {esPantallaChica ? (
        <Drawer
          id="panel-notificaciones"
          anchor="bottom"
          open={abierto}
          onClose={cerrar}
          slotProps={{
            paper: {
              sx: {
                maxHeight: '70vh',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16
              }
            }
          }}
        >
          {/* El tirador de la hoja: indica que el panel se arrastra o se cierra hacia abajo. */}
          <Box
            aria-hidden="true"
            sx={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'divider',
              mx: 'auto',
              mt: 1.25
            }}
          />
          {panel}
        </Drawer>
      ) : (
        <Popover
          id="panel-notificaciones"
          open={abierto}
          anchorEl={ancla}
          onClose={cerrar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { width: 360, maxHeight: 420 } } }}
        >
          {panel}
        </Popover>
      )}
    </>
  )
}
