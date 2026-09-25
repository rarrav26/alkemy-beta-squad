import { AppBar, Button, Container, Toolbar, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import ChangeTheme from './ChangeTheme'

// El encabezado de las pantallas PÚBLICAS: login, registro y primera contraseña. Es lo único que
// dibuja la cáscara clásica, porque con sesión verificada siempre gana mobile o escritorio (ver
// shellUtils), y las dos traen su propio encabezado.
//
// Antes acá vivía toda la navegación de la app: el menú hamburguesa, los enlaces de escritorio,
// la campana y Cerrar sesión. Todo eso pasó a la barra inferior y a la barra lateral, así que este
// archivo quedó con código que ya no podía ejecutarse — sus bloques estaban detrás de
// `sesionActiva`, y si hay sesión esta cáscara no se dibuja. Se quitó por eso, no por estética.
//
// Va transparente y sin sombra a propósito: detrás hay un fondo animado, y una barra opaca cruzada
// arriba lo cortaba en seco justo donde los rayos entran.
export default function ResponsiveAppBar() {
  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1 }}>
          <Typography
            component={Link}
            to="/"
            variant="h6"
            sx={{ fontWeight: 800, color: 'text.primary', textDecoration: 'none' }}
          >
            DigitalArs
          </Typography>

          <div style={{ flexGrow: 1 }} />
          <Button component={Link} to="/login" sx={{ textTransform: 'none', mr: 1 }}>Ingresar</Button>

          {/* El cambio de tema tiene que estar acá: si no, alguien que prefiere el modo día no
              tiene forma de cambiarlo hasta después de entrar. */}
          <ChangeTheme />
        </Toolbar>
      </Container>
    </AppBar>
  )
}
