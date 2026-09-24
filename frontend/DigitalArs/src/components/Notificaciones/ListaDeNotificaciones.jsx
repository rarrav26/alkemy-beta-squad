import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useNotificaciones } from '../../context/notificacionesContext'
import { esIngresoDeDinero } from './notificacionesUtils'
import { formatearFecha } from '../../routes/movimientosUtils'

// OJO con Typography en MUI 9: `fontWeight` ya no es una prop y `color` solo entiende nombres de
// paleta sueltos ("success", "textSecondary"), no rutas con punto ("success.main",
// "text.secondary"). Lo que no entiende lo ignora en silencio, sin warning. Por eso acá todo el
// estilo va por `sx`, que sí resuelve las rutas completas.
function ItemDeNotificacion({ notificacion, onMarcarLeida }) {
  const sinLeer = !notificacion.leida

  // El verde identifica el TIPO de aviso, así que no depende de si ya se leyó.
  const esIngreso = esIngresoDeDinero(notificacion)

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
          backgroundColor: sinLeer
            ? (esIngreso ? 'success.main' : 'primary.main')
            : 'transparent'
        }}
      />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            lineHeight: 1.3,
            fontWeight: sinLeer ? 700 : 500,
            color: esIngreso ? 'success.main' : 'text.primary'
          }}
        >
          {notificacion.titulo}
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: sinLeer ? 'text.primary' : 'text.secondary' }}
        >
          {notificacion.mensaje}
        </Typography>

        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
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
      <Typography role="status" sx={{ color: 'text.secondary', px: 2, py: 3 }}>
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
      <Typography sx={{ color: 'text.secondary', px: 2, py: 3 }}>
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
