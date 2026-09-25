import { useState } from 'react'

import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'

import { useAuth } from '../../context/authContext'
import { getSessionUser } from '../../routes/dashboardUtils'
import { esAdministrador } from '../../routes/rolesUtils'
import ChangeTheme from '../Header/ChangeTheme'
import CampanaDeNotificaciones from '../Notificaciones/CampanaDeNotificaciones'
import AvisoProximamente from '../Proximamente/AvisoProximamente'

// Encabezado del usuario con sesión activa: el saludo, la campana, el tema y Ayuda. Lo comparten
// las DOS cáscaras nuevas — en mobile va arriba de la pantalla y la navegación queda en la barra
// inferior; en escritorio va arriba de la columna de contenido, a la derecha de la barra
// lateral. Es el mismo componente a propósito: duplicarlo era la forma segura de que la campana
// terminara arreglada en una vista y no en la otra.
//
// Va sobre el fondo de la pantalla (color="transparent") para que el protagonista sea la
// tarjeta de saldo, no la barra.
export default function EncabezadoDeSesion() {
  const { session } = useAuth()
  const [avisoAbierto, setAvisoAbierto] = useState(false)

  const nombre = getSessionUser(session)?.nombre ?? 'usuario'

  // El administrador no tiene billetera y la API le responde 403 en notificaciones, así que la
  // campana le mostraría un globito que nunca puede cargar. Es el mismo control que ya hacía el
  // AppBar clásico; acá hay que repetirlo porque la barra lateral también lo atiende a él.
  const tieneCampana = !esAdministrador(session)

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

        {tieneCampana && <CampanaDeNotificaciones />}
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
