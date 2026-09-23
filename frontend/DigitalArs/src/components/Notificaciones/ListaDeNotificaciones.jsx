import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useNotificaciones } from '../../context/notificacionesContext'
import { formatearFecha } from '../../routes/movimientosUtils'

// Una notificación del panel. Es un ListItemButton y no un Box porque tocarla la marca como
// leída: tiene que ser un control de verdad, con su área de toque y su foco de teclado.
function ItemDeNotificacion({ notificacion, onMarcarLeida }) {
  const sinLeer = !notificacion.leida

  return (
    <ListItemButton
      onClick={() => onMarcarLeida(notificacion.id)}
      // Una ya leída no tiene nada que hacer al tocarla, pero se deja habilitada igual: un
      // control que se apaga después de usarlo confunde más de lo que ayuda.
      alignItems="flex-start"
      sx={{
        gap: 1.25,
        px: 2,
        py: 1.5,
        backgroundColor: sinLeer ? 'action.hover' : 'transparent',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* El punto marca lo no leído sin depender solo del fondo, que en modo claro es muy sutil.
          Cuando ya está leída se deja el hueco vacío para que el texto no se corra de lugar. */}
      <Box
        aria-hidden="true"
        sx={{
          width: 8,
          height: 8,
          mt: 0.9,
          borderRadius: '50%',
          flexShrink: 0,
          backgroundColor: sinLeer ? 'primary.main' : 'transparent'
        }}
      />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          fontWeight={sinLeer ? 700 : 500}
          sx={{ lineHeight: 1.3 }}
        >
          {notificacion.titulo}
        </Typography>

        <Typography
          variant="body2"
          color={sinLeer ? 'text.primary' : 'text.secondary'}
        >
          {notificacion.mensaje}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {formatearFecha(notificacion.fecha)}
        </Typography>
      </Box>
    </ListItemButton>
  )
}

// Decide qué se ve dentro del panel. Se resuelve con returns tempranos, igual que
// ContenidoDeLaLista en Movimientos.jsx, para no anidar condiciones dentro del JSX.
function ContenidoDelPanel({ cargando, error, notificaciones, onMarcarLeida, onReintentar }) {
  if (cargando) {
    return (
      <Typography color="text.secondary" role="status" sx={{ px: 2, py: 3 }}>
        Cargando notificaciones…
      </Typography>
    )
  }

  // El error va antes que el vacío: si la lista quedó vacía porque la carga falló, no sabemos si
  // el usuario tiene notificaciones, así que no lo afirmamos.
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onReintentar}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    )
  }

  if (notificaciones.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ px: 2, py: 3 }}>
        No tenés notificaciones.
      </Typography>
    )
  }

  return (
    <List disablePadding>
      {notificaciones.map(notificacion => (
        <ItemDeNotificacion
          key={notificacion.id}
          notificacion={notificacion}
          onMarcarLeida={onMarcarLeida}
        />
      ))}
    </List>
  )
}

export default function ListaDeNotificaciones() {
  const { notificaciones, cargando, error, recargar, marcarLeida } = useNotificaciones()

  return (
    <Stack aria-busy={cargando} sx={{ overflowY: 'auto' }}>
      <ContenidoDelPanel
        cargando={cargando}
        error={error}
        notificaciones={notificaciones}
        onMarcarLeida={marcarLeida}
        onReintentar={recargar}
      />
    </Stack>
  )
}
