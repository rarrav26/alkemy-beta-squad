import { useState } from 'react'

import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import NotificationsRounded from '@mui/icons-material/NotificationsRounded'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { useNotificaciones } from '../../context/notificacionesContext'
import TiradorDeHoja from '../Navegacion/TiradorDeHoja'
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
        {/* El peso va por sx: en MUI 9, Typography ya no acepta `fontWeight` como prop y lo
            ignora sin avisar. */}
        <Typography component="h2" sx={{ fontWeight: 700 }}>
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
          <NotificationsRounded />
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
                borderTopRightRadius: 16,
                // Sin barra de scroll, como el resto de la vista mobile: la lista se desliza con
                // el dedo. Va sobre la hoja y todo lo que tiene adentro porque quien hace el
                // scroll es la lista (ListaDeNotificaciones), no la hoja. En escritorio el panel
                // es un Popover y la barra se mantiene.
                scrollbarWidth: 'none',
                '& *': { scrollbarWidth: 'none' },
                '&::-webkit-scrollbar, & *::-webkit-scrollbar': { display: 'none' }
              }
            }
          }}
        >
          <TiradorDeHoja />
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
