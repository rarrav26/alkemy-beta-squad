import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/authContext'
import { seccionesDelMenuMas } from '../../routes/navegacionUtils'
import { esAdministrador } from '../../routes/rolesUtils'
import { ICONO_POR_SECCION } from './iconosDeSeccion'
import TiradorDeHoja from './TiradorDeHoja'
import { papelDeHojaInferior } from '../Comunes/hojaInferior'

// En mobile el AppBar con el menú hamburguesa no se muestra, así que este es el único camino a
// las secciones que no entran en la barra inferior y a Cerrar sesión. El contenido sale de
// navegacionUtils, con la lista del rol que corresponda: el usuario regular llega acá a
// Movimientos y Perfil; el administrador, solo a Perfil.
//
// Cerrar sesión va acá y no como pestaña: es una acción destructiva, no una sección.
export default function MenuMas({ open, onClose }) {
  const { session, logout } = useAuth()

  const secciones = seccionesDelMenuMas(esAdministrador(session))

  // logout() se llama sin argumentos a propósito: su primer parámetro es el motivo que se le
  // muestra al usuario en el login, y pasarle el evento del click lo pondría como motivo.
  function cerrarSesion() {
    onClose()
    logout()
  }

  return (
    <Drawer
      id="menu-mas"
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: papelDeHojaInferior
        }
      }}
    >
      <TiradorDeHoja />

      <List component="nav" aria-label="Más opciones">
        {secciones.map(({ id, etiqueta, to }) => {
          const Icono = ICONO_POR_SECCION[id]

          return (
            <ListItemButton key={id} component={Link} to={to} onClick={onClose}>
              <ListItemIcon>
                <Icono aria-hidden="true" />
              </ListItemIcon>
              <ListItemText primary={etiqueta} />
            </ListItemButton>
          )
        })}

        <Divider sx={{ my: 1 }} />

        <ListItemButton onClick={cerrarSesion}>
          <ListItemIcon>
            <LogoutRounded aria-hidden="true" />
          </ListItemIcon>
          <ListItemText primary="Cerrar sesión" />
        </ListItemButton>
      </List>
    </Drawer>
  )
}
