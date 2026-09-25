import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { useAuth } from '../context/authContext'
import { esSesionActiva } from '../routes/rolesUtils'
import { shellQueCorresponde } from '../routes/shellUtils'

// Reemplaza a useNavegacionMobile. Ahora hay tres cáscaras y no dos, así que la pregunta pasó
// de "¿es mobile?" a "¿cuál va?", y una respuesta booleana ya no alcanzaba.
//
// Acá solo se leen los dos datos que hacen falta; quién gana lo decide shellQueCorresponde, que
// es pura y tiene sus tests. El rol no se consulta: la cáscara es la misma para los dos y lo que
// cambia es su CONTENIDO, que cada barra resuelve por su cuenta con navegacionUtils.
//
// Lo usan App (para dibujar la cáscara) y Dashboard (para elegir qué vista de Inicio mostrar), y
// las dos llaman a este mismo hook.
export default function useShell() {
  const auth = useAuth()
  const theme = useTheme()

  // El mismo corte que usa la campana para pasar de Popover a Drawer.
  const esPantallaChica = useMediaQuery(theme.breakpoints.down('md'))

  return shellQueCorresponde({
    sesionActiva: esSesionActiva(auth),
    esPantallaChica
  })
}
