import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import { InitialPasswordPage, LoginPage, RegisterPage } from '../../routes/AuthPages'
import Dashboard, { NewUserPage } from '../../routes/Dashboard'
import { MovimientosPage } from '../../routes/Movimientos'
import PerfilPage from '../../routes/Perfil'
import UsuariosAdmin from '../../routes/UsuariosAdmin'

function Protected({ children, admin = false }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  
  const rol = session?.user?.role || session?.user?.rol || session?.role
  if (admin && rol !== 'Administrador') return <Navigate to="/dashboard" replace />
  
  return children
}

export default function Main() {
  const { ready, connectionError, retry, session } = useAuth()
  
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
      <Routes>
        <Route path="/" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
        <Route path="/setup" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/primera-password" element={<InitialPasswordPage />} />
        
        {/* Rutas para cualquier usuario autenticado */}
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/movimientos" element={<Protected><MovimientosPage /></Protected>} />
        <Route path="/perfil" element={<Protected><PerfilPage /></Protected>} />
        
        {/* Rutas exclusivas de Administrador */}
        <Route path="/usuarios/nuevo" element={<Protected admin><NewUserPage /></Protected>} />
        <Route path="/admin/usuarios" element={<Protected admin><UsuariosAdmin /></Protected>} />
        
        {/* Ruta comodín */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  )
}