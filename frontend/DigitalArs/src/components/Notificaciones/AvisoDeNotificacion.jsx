import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

import { useNotificaciones } from '../../context/notificacionesContext'
import useShell from '../../hooks/useShell'
import { SHELL_MOBILE } from '../../routes/shellUtils'

const MILISEGUNDOS_DEL_AVISO = 5000

// El cartel flotante de las notificaciones (un aviso que llega en el momento, o un error al
// marcarlas como leídas). El estado lo maneja NotificacionesProvider; este componente solo lo
// dibuja, y va montado DENTRO del ThemeProvider (App.jsx) para salir con los colores de la app.
//
// Dónde aparece:
// - En mobile, abajo y por encima de la barra inferior. Arriba tapaba el encabezado entero,
//   campana incluida, justo cuando el usuario quiere ver el globito sumar.
// - En escritorio, arriba y al centro, debajo de nada importante. Vale para las dos cáscaras de
//   pantalla ancha: la de la barra lateral y la clásica del administrador.
export default function AvisoDeNotificacion() {
  const { aviso, cerrarAviso } = useNotificaciones()
  const esVistaMobile = useShell() === SHELL_MOBILE

  const posicion = esVistaMobile
    ? { vertical: 'bottom', horizontal: 'center' }
    : { vertical: 'top', horizontal: 'center' }

  return (
    <Snackbar
      open={aviso !== null}
      autoHideDuration={MILISEGUNDOS_DEL_AVISO}
      onClose={cerrarAviso}
      anchorOrigin={posicion}
      // Los 96px son el alto de la barra inferior más el botón de QR que sobresale: la misma
      // separación que usa AvisoProximamente, así los avisos de abajo quedan todos alineados.
      sx={esVistaMobile ? { bottom: { xs: 96 } } : undefined}
    >
      <Alert severity={aviso?.severidad ?? 'info'} variant="filled" onClose={cerrarAviso}>
        {aviso?.mensaje ?? ''}
      </Alert>
    </Snackbar>
  )
}
