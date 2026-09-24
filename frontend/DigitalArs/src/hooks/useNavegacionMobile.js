import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { useAuth } from '../context/authContext'
import { esAdministrador, esSesionActiva } from '../routes/rolesUtils'

// Decide si se usa la navegación mobile (encabezado propio + barra inferior) en lugar del
// AppBar de siempre. Es una sola fuente para App y Dashboard: si cada uno hiciera su propia
// cuenta, podrían no coincidir y quedar una pantalla con las dos navegaciones o con ninguna.
// El administrador queda afuera porque no tiene billetera: la barra inferior no le sirve.
export default function useNavegacionMobile() {
  const auth = useAuth()
  const theme = useTheme()

  // El mismo corte que usa la campana para pasar de Popover a Drawer.
  const esPantallaChica = useMediaQuery(theme.breakpoints.down('md'))

  if (!esPantallaChica) return false
  if (!esSesionActiva(auth)) return false
  return !esAdministrador(auth.session)
}
