import { useState } from 'react'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import AuthForm, { ProfileFields } from '../components/Auth/AuthForm'

export default function Dashboard() {
  const { session } = useAuth()
  return <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 3, md: 6 } }}>
    <Typography variant="overline" color="primary">Tu espacio</Typography>
    <Typography component="h1" variant="h3" fontWeight={700}>Hola, {session.user.nombre}</Typography>
    <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>Bienvenido a tu cuenta de DigitalArs.</Typography>
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2} alignItems="flex-start">
        <Chip label={session.user.role} />
        <Typography>{session.user.email}</Typography>
        {session.user.role === 'Administrador'
          ? <><Typography>Registrá usuarios y entregales una invitación para que elijan su contraseña.</Typography>
            <Button component={Link} to="/usuarios/nuevo" variant="contained">Registrar usuario</Button></>
          : <Typography>Tu cuenta está activa y lista para continuar.</Typography>}
      </Stack>
    </Paper>
  </Box>
}

export function NewUserPage() {
  const { createUser } = useAuth()
  const [invitation, setInvitation] = useState(null)
  const [copyMessage, setCopyMessage] = useState('')
  if (invitation) return <Box sx={{ maxWidth: 650, mx: 'auto', p: 3 }}>
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Typography component="h1" variant="h4">Usuario registrado</Typography>
        <Alert severity="success">Se creó la cuenta de {invitation.email}. Todavía debe elegir su contraseña.</Alert>
        <Typography>Entregale este código por un medio privado. Vence en 24 horas y se usa una sola vez.</Typography>
        <TextField label="Código de invitación" value={invitation.invitationToken} multiline minRows={3}
          slotProps={{ input: { readOnly: true } }} />
        <Button onClick={async () => {
          try { await navigator.clipboard.writeText(invitation.invitationToken); setCopyMessage('Código copiado.') }
          catch { setCopyMessage('Seleccioná el código y copialo manualmente.') }
        }}>Copiar código</Button>
        {copyMessage && <Alert severity="info">{copyMessage}</Alert>}
        <Typography>Debe entrar a {window.location.origin}/primera-password con su correo y este código.</Typography>
        <Button variant="contained" onClick={() => { setInvitation(null); setCopyMessage('') }}>Registrar otro usuario</Button>
        <Button component={Link} to="/dashboard">Volver al dashboard</Button>
      </Stack>
    </Paper>
  </Box>
  return <AuthForm title="Registrar usuario" description="El usuario establecerá su contraseña mediante una invitación."
    submitLabel="Crear usuario" onSubmit={async data => setInvitation(await createUser(data))}
    footer={<Button component={Link} to="/dashboard">Volver al dashboard</Button>}>
    <ProfileFields />
  </AuthForm>
}