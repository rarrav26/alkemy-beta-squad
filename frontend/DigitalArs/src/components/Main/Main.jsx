import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import Aparicion from '../Comunes/Aparicion'
import { InitialPasswordPage, LoginPage, RegisterPage } from '../../routes/AuthPages'
import CuentasPage from '../../routes/Cuentas'
import TarjetasPage from '../../routes/Tarjetas'
import Dashboard, { NewUserPage } from '../../routes/Dashboard'
import { MovimientosPage } from '../../routes/Movimientos'
import PerfilPage from '../../routes/Perfil'
import UsuariosAdmin from '../../routes/UsuariosAdmin'
import Bienvenida from '../../routes/Bienvenida'
import { ROL_ADMINISTRADOR, ROL_USUARIO, puedeVerRuta } from '../../routes/rolesUtils'

// Una ruta protegida no dibuja NADA hasta que el provider confirme contra el servidor que la
// sesión sigue valiendo. Antes se renderizaba con lo que había en sessionStorage y la baja del
// usuario se descubría después, cuando alguna llamada devolvía 403: se alcanzaba a ver el
// dashboard y recién entonces lo expulsaba.
// Esconder la pantalla no es el control de acceso: eso lo hace la API. Esto evita mostrarle a
// alguien una vista que de todos modos no podría usar.
function Protected({ children, rol }) {
  const { session, sesionVerificada } = useAuth()

  if (!session) return <Navigate to="/login" replace />

  if (!sesionVerificada) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <CircularProgress aria-label="Verificando tu sesión" />
      </Box>
    )
  }

  // /dashboard no pide rol, así que redirigir ahí nunca vuelve a caer en este mismo control.
  if (!puedeVerRuta(session, rol)) return <Navigate to="/dashboard" replace />

  return children
}

export default function Main() {
  const { ready, connectionError, retry, session } = useAuth()
  const ubicacion = useLocation()

  // La presentación pública no depende de que la API esté disponible.
  if (ubicacion.pathname === '/' && !session) {
    return <Box component="main"><Bienvenida /></Box>
  }
  
  if (!ready) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <CircularProgress aria-label="Cargando aplicación" />
      </Box>
    )
  }

  if (connectionError) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
        <Alert severity="error">{connectionError}</Alert>
        <Button onClick={retry}>Volver a intentar</Button>
      </Stack>
    )
  }

  return (
    <Box component="main" sx={{ minHeight: '70vh' }}>
      {/* La pantalla nueva entra apareciendo y subiendo un poco. La `key` con la ruta es lo que
          hace que la animación vuelva a arrancar en cada navegación: sin ella, React reutiliza la
          caja y la animación solo correría la primera vez.
          Va en la ruta y no en el objeto `location` entero, así un cambio de query (por ejemplo
          los filtros del historial, que escriben ?buscar=) no reinicia la animación mientras el
          usuario está tipeando en la misma pantalla. */}
      <Aparicion key={ubicacion.pathname}>
        <Routes>
          <Route path="/" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
          <Route path="/setup" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/primera-password" element={<InitialPasswordPage />} />

          {/* Rutas para cualquier usuario autenticado */}
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/perfil" element={<Protected><PerfilPage /></Protected>} />

          {/* Rutas exclusivas del usuario regular: el administrador no tiene billetera */}
          <Route path="/movimientos" element={<Protected rol={ROL_USUARIO}><MovimientosPage /></Protected>} />
          <Route path="/cuentas" element={<Protected rol={ROL_USUARIO}><CuentasPage /></Protected>} />
          <Route path="/tarjetas" element={<Protected rol={ROL_USUARIO}><TarjetasPage /></Protected>} />

          {/* Rutas exclusivas de Administrador */}
          <Route path="/usuarios/nuevo" element={<Protected rol={ROL_ADMINISTRADOR}><NewUserPage /></Protected>} />
          <Route path="/admin/usuarios" element={<Protected rol={ROL_ADMINISTRADOR}><UsuariosAdmin /></Protected>} />

          {/* Ruta comodín */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Aparicion>
    </Box>
  )
}
