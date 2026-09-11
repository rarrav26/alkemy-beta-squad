import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    const data = new FormData(event.currentTarget)
    const email = String(data.get('email')).trim()
    const password = String(data.get('password'))

    setError('')

    if (typeof onLogin !== 'function') {
      setError('El inicio de sesión todavía no está conectado.')
      return
    }

    setLoading(true)

    try {
      await onLogin({ email, password })
    } catch {
      setError(
        'No pudimos iniciar sesión. Revisá tus datos e intentá de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      component='main'
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',

        p: 2,
        boxSizing: 'border-box'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxSizing: 'border-box'
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography
              variant='overline'
              sx={{ color: 'primary.main', fontWeight: 700 }}
            >
              Inicia sesion
            </Typography>

            <Typography component='h1' variant='h4' fontWeight={700}>
              ¡Hola de nuevo!
            </Typography>

            <Typography color='text.secondary' sx={{ mt: 1 }}>
              Ingresá para administrar tu dinero.
            </Typography>
          </Box>

          <Box component='form' onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity='error'>{error}</Alert>}

              <TextField
                id='login-email'
                name='email'
                label='Correo electrónico'
                type='email'
                autoComplete='username'
                required
                fullWidth
                disabled={loading}
              />

              <TextField
                id='login-password'
                name='password'
                label='Contraseña'
                type='password'
                autoComplete='current-password'
                required
                fullWidth
                disabled={loading}
              />

              <Button
                type='submit'
                variant='contained'
                size='large'
                fullWidth
                disabled={loading}
                sx={{ borderRadius: 2, py: 1.5, textTransform: 'none' }}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  )
}

export default Login
