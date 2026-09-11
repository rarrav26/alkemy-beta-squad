import { Button, Stack, TextField } from '@mui/material'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import AuthForm, { PasswordFields, ProfileFields } from '../components/Auth/AuthForm'

export function LoginPage() {
  const { login, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Quien todavía no definió su contraseña no ve un error: va a elegirla.
  async function ingresar(data) {
    try {
      await login(data)
    } catch (error) {
      if (error.code !== 'PASSWORD_SETUP_REQUIRED') throw error
      navigate('/primera-password', { state: { email: data.email, message: error.message } })
      return
    }
    navigate('/dashboard', { replace: true })
  }

  if (session) return <Navigate to="/dashboard" replace />
  return <AuthForm title="¡Hola de nuevo!" description="Ingresá para administrar tu cuenta."
    submitLabel="Ingresar" success={location.state?.message}
    onSubmit={ingresar}
    footer={<Stack spacing={1}>
      <Button component={Link} to="/register">Crear una cuenta</Button>
      <Button component={Link} to="/primera-password">Tengo una invitación</Button>
    </Stack>}>
    <TextField name="email" label="Correo electrónico" type="email" autoComplete="username" required fullWidth />
    <TextField name="password" label="Contraseña" type="password" autoComplete="current-password" required fullWidth />
  </AuthForm>
}

function mensajeDeCuentaCreada(cuenta) {
  return `Cuenta creada con saldo $0. Tu alias es ${cuenta.alias} y tu CVU es ${cuenta.cvu}. Ya podés iniciar sesión.`
}

export function RegisterPage() {
  const { register, session } = useAuth()
  const navigate = useNavigate()
  if (session) return <Navigate to="/dashboard" replace />
  return <AuthForm title="Creá tu cuenta" description="Completá tus datos para registrarte."
    submitLabel="Registrarme"
    onSubmit={async data => {
      const cuenta = await register(data)
      navigate('/login', { replace: true, state: { message: mensajeDeCuentaCreada(cuenta) } })
    }}
    footer={<Button component={Link} to="/login">Ya tengo una cuenta</Button>}>
    <ProfileFields /><PasswordFields />
  </AuthForm>
}

export function InitialPasswordPage() {
  const { initialPassword, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Si llegó derivado desde el login ya sabemos su correo: se lo dejamos cargado.
  const emailSugerido = location.state?.email ?? ''
  if (session) return <Navigate to="/dashboard" replace />
  return <AuthForm title="Elegí tu contraseña" description="Usá la invitación que te entregó el administrador."
    submitLabel="Establecer contraseña" success={location.state?.message}
    onSubmit={async data => { await initialPassword(data); navigate('/dashboard', { replace: true }) }}
    footer={<Button component={Link} to="/login">Volver al inicio de sesión</Button>}>
    <TextField name="email" label="Correo electrónico" type="email" autoComplete="username" required fullWidth
      defaultValue={emailSugerido} />
    <TextField name="invitationToken" label="Código de invitación" autoComplete="off" required fullWidth multiline minRows={2} />
    <PasswordFields />
  </AuthForm>
}
