import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import ChangeTheme from './ChangeTheme'

export default function ResponsiveAppBar() {
  const { session, logout, ready, connectionError } = useAuth()
  return <AppBar position="static" elevation={0}><Container maxWidth="lg">
    <Toolbar disableGutters sx={{ gap: 1, flexWrap: 'wrap' }}>
      <Typography component={Link} to="/" variant="h6"
        sx={{ fontWeight: 800, color: 'inherit', textDecoration: 'none' }}>DigitalArs</Typography>
      <Box sx={{ flexGrow: 1 }} />
      {ready && !connectionError && session && <>
        <Button color="inherit" component={Link} to="/dashboard">Mi cuenta</Button>
        <Button color="inherit" onClick={logout}>Cerrar sesión</Button>
      </>}
      <ChangeTheme />
    </Toolbar>
  </Container></AppBar>
}