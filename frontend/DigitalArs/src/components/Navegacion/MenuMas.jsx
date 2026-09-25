import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import PersonRounded from '@mui/icons-material/PersonRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/authContext'
import TiradorDeHoja from './TiradorDeHoja'

const ENLACES_DEL_MENU = [
  { etiqueta: 'Movimientos', to: '/movimientos', Icono: ReceiptLongRounded },
  { etiqueta: 'Perfil', to: '/perfil', Icono: PersonRounded }
]

// En mobile el AppBar con el menú hamburguesa no se muestra, así que este es el único camino a
// Movimientos, Perfil y Cerrar sesión. Si se agrega una sección nueva sin lugar en la barra
// inferior, va en ENLACES_DEL_MENU.
export default function MenuMas({ open, onClose }) {
  const { logout } = useAuth()

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
          sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, pb: 'env(safe-area-inset-bottom)' }
        }
      }}
    >
      <TiradorDeHoja />

      <List component="nav" aria-label="Más opciones">
        {ENLACES_DEL_MENU.map(({ etiqueta, to, Icono }) => (
          <ListItemButton key={to} component={Link} to={to} onClick={onClose}>
            <ListItemIcon>
              <Icono aria-hidden="true" />
            </ListItemIcon>
            <ListItemText primary={etiqueta} />
          </ListItemButton>
        ))}

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
