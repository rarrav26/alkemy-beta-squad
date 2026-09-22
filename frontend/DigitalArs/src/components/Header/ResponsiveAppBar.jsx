import { useState } from 'react'
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import ChangeTheme from './ChangeTheme'

export default function ResponsiveAppBar() {
  const { session, logout, ready, connectionError, sesionVerificada } = useAuth()

  // Ancla del menú mobile. Se sigue el mismo patrón que ya usaba este AppBar: un IconButton
  // visible solo hasta "md" que abre un Menu con los mismos destinos que la barra de escritorio.
  const [anclaMenu, setAnclaMenu] = useState(null)
  const menuAbierto = Boolean(anclaMenu)

  const abrirMenu = event => setAnclaMenu(event.currentTarget)
  const cerrarMenu = () => setAnclaMenu(null)

  const user = session?.user || session?.usuario || session
  const esAdmin =
    user?.role === 'Administrador' ||
    user?.rol === 'Administrador' ||
    user?.Role === 'Administrador'

  // La navegación exige que la sesión esté VERIFICADA, no solo presente. El encabezado se
  // dibuja fuera de las rutas, así que sin este control un usuario desactivado alcanzaba a ver
  // la barra con "Mi cuenta / Perfil / Cerrar sesión" mientras se comprobaba su estado.
  const sesionActiva = ready && !connectionError && Boolean(session) && sesionVerificada

  // Una sola lista de destinos para las dos vistas: si mañana se agrega una sección, aparece
  // en la barra y en el menú mobile sin tener que acordarse de tocar los dos lugares.
  const enlaces = [
    { etiqueta: 'Mi cuenta', to: '/dashboard' },
    ...(esAdmin ? [{ etiqueta: 'Ver usuarios', to: '/admin/usuarios' }] : []),
    { etiqueta: 'Perfil', to: '/perfil' }
  ]

  return (
    <AppBar position="static" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1 }}>
          {/* Hamburguesa: solo por debajo de "md", y solo si hay algo que navegar. */}
          {sesionActiva && (
            <IconButton
              color="inherit"
              edge="start"
              aria-label="Abrir menú de navegación"
              aria-controls={menuAbierto ? 'menu-navegacion' : undefined}
              aria-haspopup="true"
              aria-expanded={menuAbierto ? 'true' : undefined}
              onClick={abrirMenu}
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            component={Link}
            to="/"
            variant="h6"
            sx={{ fontWeight: 800, color: 'inherit', textDecoration: 'none' }}
          >
            DigitalArs
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Barra de escritorio: los mismos enlaces, visibles desde "md". */}
          {sesionActiva && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {enlaces.map(enlace => (
                <Button key={enlace.to} color="inherit" component={Link} to={enlace.to}>
                  {enlace.etiqueta}
                </Button>
              ))}
              <Button color="inherit" onClick={logout}>
                Cerrar sesión
              </Button>
            </Box>
          )}

          <ChangeTheme />

          {/* El menú vive fuera de los dos bloques: se ancla al IconButton y se cierra al
              elegir un destino, así en mobile no queda abierto sobre la pantalla nueva. */}
          <Menu
            id="menu-navegacion"
            anchorEl={anclaMenu}
            open={menuAbierto}
            onClose={cerrarMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            sx={{ display: { xs: 'block', md: 'none' } }}
          >
            {enlaces.map(enlace => (
              <MenuItem
                key={enlace.to}
                component={Link}
                to={enlace.to}
                onClick={cerrarMenu}
              >
                {enlace.etiqueta}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem
              onClick={() => {
                cerrarMenu()
                logout()
              }}
            >
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
