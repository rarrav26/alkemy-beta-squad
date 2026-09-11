import { useState } from 'react'
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'

export default function AuthForm({ title, description, submitLabel, onSubmit, children, footer, success }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (loading) return
    const data = Object.fromEntries(new FormData(event.currentTarget))
    if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError('')
    try { await onSubmit(data) }
    catch (failure) { setError(failure.message) }
    finally { setLoading(false) }
  }
  return <Box sx={{ maxWidth: 540, mx: 'auto', px: 2, py: { xs: 4, md: 7 } }}>
    <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="primary">DigitalArs</Typography>
          <Typography component="h1" variant="h4" fontWeight={700}>{title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography>
        </Box>
        {success && <Alert severity="success">{success}</Alert>}
        {error && <Alert severity="error" role="alert">{error}</Alert>}
        <Box component="form" onSubmit={submit} aria-busy={loading}>
          <Box component="fieldset" disabled={loading} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
            <Stack spacing={2}>
              {children}
              <Button variant="contained" type="submit" size="large" disabled={loading}>
                {loading ? 'Procesando…' : submitLabel}
              </Button>
            </Stack>
          </Box>
        </Box>
        {footer}
      </Stack>
    </Paper>
  </Box>
}

export function ProfileFields() {
  return <>
    <TextField name="nombre" label="Nombre" autoComplete="given-name" required fullWidth slotProps={{ htmlInput: { maxLength: 100 } }} />
    <TextField name="apellido" label="Apellido" autoComplete="family-name" required fullWidth slotProps={{ htmlInput: { maxLength: 100 } }} />
    <TextField name="email" label="Correo electrónico" type="email" autoComplete="email" required fullWidth slotProps={{ htmlInput: { maxLength: 256 } }} />
    <TextField select name="tipoDocumento" label="Tipo de documento" defaultValue="DNI" required fullWidth>
      <MenuItem value="DNI">DNI</MenuItem>
      <MenuItem value="PASAPORTE">Pasaporte</MenuItem>
    </TextField>
    <TextField name="nroDocumento" label="Número de documento" required fullWidth
      helperText="DNI: 7 u 8 números. Pasaporte: 2 o 3 letras y 6 o 7 números (ej. AB123456)."
      slotProps={{ htmlInput: { maxLength: 20 } }} />
  </>
}

export function PasswordFields() {
  return <>
    <TextField name="password" label="Contraseña" type="password" autoComplete="new-password" required fullWidth
      helperText="Entre 8 y 128 caracteres, con mayúscula, minúscula, número y símbolo."
      slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }} />
    <TextField name="confirmPassword" label="Repetí la contraseña" type="password" autoComplete="new-password" required fullWidth />
  </>
}