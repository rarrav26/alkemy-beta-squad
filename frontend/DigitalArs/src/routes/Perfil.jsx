import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useAuth } from '../context/authContext'
import { getSessionUser } from './dashboardUtils'
import { buildAliasPayload, buildProfilePayload } from './perfilUtils'

// Espejo de DatosDeCuenta.PatronAlias en el backend: tres palabras separadas por puntos.
// Se valida en el front solo para avisar antes de llamar a la API; la regla que manda sigue
// siendo la del backend.
const FORMATO_ALIAS = /^[a-z]+\.[a-z]+\.[a-z]+$/

const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS'
})

// Ya no recibe darkMode: los colores salen del tema, que es quien sabe en qué modo está.
function InfoCard({ label, value, alignRight = false }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 2,
        borderColor: 'divider',
        backgroundColor: 'action.hover',
        boxShadow: 'none'
      }}
    >
      <CardContent sx={{ py: 0.9, px: 2, '&:last-child': { pb: 0.9 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            minHeight: 22
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              whiteSpace: 'nowrap',
              color: 'text.secondary',
              fontSize: '1rem',
              lineHeight: 1.4
            }}
          >
            {label}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: alignRight ? 'flex-end' : 'flex-start',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              color: 'text.primary',
              fontSize: '1rem',
              lineHeight: 1.4
            }}
          >
            {typeof value === 'string' || typeof value === 'number' ? (
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 500,
                  textAlign: alignRight ? 'right' : 'left',
                  color: 'inherit'
                }}
              >
                {value}
              </Typography>
            ) : (
              value ?? '-'
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function PerfilPage() {
  const { obtenerMiPerfil, actualizarMiPerfil, actualizarAliasCuenta, session } = useAuth()
  const usuario = getSessionUser(session)
  const esAdmin = usuario?.role === 'Administrador'
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Se distingue el error de CARGA del error de guardado. Solo el de carga justifica
  // reemplazar la pantalla por un cartel con "Reintentar": si no se pudo traer el perfil no
  // hay nada que mostrar. Un alias mal escrito, en cambio, no tiene que hacer desaparecer la
  // página que el usuario está completando.
  const [errorDeCarga, setErrorDeCarga] = useState('')
  const [errorAlias, setErrorAlias] = useState('')
  const [exito, setExito] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [editandoAlias, setEditandoAlias] = useState(false)
  const [alias, setAlias] = useState('')
  const [formulario, setFormulario] = useState({ nombre: '', apellido: '', email: '', currentPassword: '' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function cargarPerfil() {
      setCargando(true)
      setError('')
      setErrorDeCarga('')
      setErrorAlias('')
      setExito('')
      setPerfil(null)

      try {
        const datos = await obtenerMiPerfil(controller.signal)
        if (!controller.signal.aborted) {
          setPerfil(datos)
          setAlias(datos?.cuenta?.alias ?? '')
          setFormulario({
            nombre: datos?.nombre ?? '',
            apellido: datos?.apellido ?? '',
            email: datos?.email ?? '',
            currentPassword: ''
          })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          const mensajeCrudo = (error.message || '').trim()
          const frasesUnicas = [
            ...new Set(
              mensajeCrudo
                .split('.')
                .map(frase => frase.trim())
                .filter(Boolean)
            )
          ]
          setErrorDeCarga(
            frasesUnicas.length > 0
              ? `${frasesUnicas.join('. ')}.`
              : mensajeCrudo
          )
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false)
      }
    }

    cargarPerfil()
    return () => controller.abort()
  }, [obtenerMiPerfil, intento])

  const emailCambio =
    !!perfil?.email &&
    !!formulario.email &&
    formulario.email.trim().toLowerCase() !== perfil.email.trim().toLowerCase()

  const manejarCambio = event => {
    const { name, value } = event.target
    setFormulario(actual => ({ ...actual, [name]: value }))
    setError('')
    setExito('')
  }

  const guardarCambios = async event => {
    event.preventDefault()

    const nombre = formulario.nombre.trim()
    const apellido = formulario.apellido.trim()
    const email = formulario.email.trim()

    if (!nombre || !apellido || !email) {
      setError('Completá nombre, apellido y email.')
      return
    }

    if (emailCambio && !formulario.currentPassword.trim()) {
      setError('Para cambiar el email, ingresá tu contraseña actual.')
      return
    }

    setGuardando(true)
    setError('')
    setExito('')

    try {
      const payload = buildProfilePayload(
        { nombre, apellido, email },
        perfil?.email ?? '',
        formulario.currentPassword
      )
      const actualizado = await actualizarMiPerfil(payload)
      setPerfil(actualizado ?? { ...perfil, nombre, apellido, email })
      setFormulario({
        nombre: actualizado?.nombre ?? nombre,
        apellido: actualizado?.apellido ?? apellido,
        email: actualizado?.email ?? email,
        currentPassword: ''
      })
      setExito('Tus datos se actualizaron correctamente.')
      setEditando(false)
    } catch (error) {
      setError(error.message || 'No se pudo guardar tu perfil.')
    } finally {
      setGuardando(false)
    }
  }

  const guardarAlias = async event => {
    event.preventDefault()

    // Misma regla que el backend (DatosDeCuenta): tres palabras separadas por puntos. Se
    // valida acá para avisar junto al campo, sin ir hasta la API para un error de tipeo.
    const aliasTrim = alias.trim().toLowerCase()

    if (!aliasTrim) {
      setErrorAlias('El alias no puede estar vacío.')
      return
    }

    if (!FORMATO_ALIAS.test(aliasTrim)) {
      setErrorAlias('Tres palabras separadas por puntos, por ejemplo auto.perro.gato')
      return
    }

    setGuardando(true)
    setError('')
    setErrorAlias('')
    setExito('')

    try {
      const payload = buildAliasPayload(aliasTrim)
      const actualizado = await actualizarAliasCuenta(payload.alias)
      setPerfil(actual => ({
        ...actual,
        cuenta: { ...actual?.cuenta, alias: actualizado?.alias ?? payload.alias }
      }))
      setAlias(actualizado?.alias ?? payload.alias)
      setExito('Tu alias se actualizó correctamente.')
      setEditandoAlias(false)
    } catch (error) {
      setErrorAlias(error.message || 'No se pudo guardar el alias.')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', p: 4, display: 'grid', placeItems: 'center' }}>
        <Stack sx={{ alignItems: 'center' }} spacing={2}>
          <CircularProgress />
          <Typography>Cargando tu perfil…</Typography>
        </Stack>
      </Box>
    )
  }

  // Solo un fallo de carga reemplaza la pantalla: sin perfil no hay nada que editar. Los
  // errores de validación y de guardado se muestran en contexto, sin desmontar la página.
  if (errorDeCarga) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto', p: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setIntento(valor => valor + 1)}>
              Reintentar
            </Button>
          }
        >
          {errorDeCarga}
        </Alert>
      </Box>
    )
  }

  const saldo = perfil?.cuenta?.saldo ?? 0
  const mostrarSaldo = esAdmin
  // No todo usuario tiene cuenta de billetera: el administrador inicial se siembra sin una.
  const tieneCuenta = Boolean(perfil?.cuenta)

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: 'auto',
        p: { xs: 2.5, md: 4 },
        backgroundColor: 'background.default',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        color: 'text.primary'
      }}
    >
      <Typography
        variant="h4"
        fontWeight={700}
        sx={{ mb: 3, color: 'text.primary', fontFamily: 'sans-serif' }}
      >
        Datos personales
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {exito && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {exito}
        </Alert>
      )}

      <Stack spacing={3}>
        {!editando ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 0.5, width: '100%' }}>
            <InfoCard label="Nombre" value={perfil?.nombre ?? '-'} alignRight />
            <InfoCard label="Apellido" value={perfil?.apellido ?? '-'} alignRight />
            <InfoCard label="Tipo de documento" value={perfil?.tipoDocumento ?? '-'} alignRight />
            <InfoCard label="Número de documento" value={perfil?.nroDocumento ?? '-'} alignRight />
            <InfoCard label="Email" value={perfil?.email ?? '-'} alignRight />
          </Box>
        ) : (
          <Box component="form" onSubmit={guardarCambios} sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Nombre"
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Apellido"
              name="apellido"
              value={formulario.apellido}
              onChange={manejarCambio}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formulario.email}
              onChange={manejarCambio}
              fullWidth
              variant="outlined"
            />
            {emailCambio && (
              <TextField
                label="Contraseña actual"
                name="currentPassword"
                type="password"
                value={formulario.currentPassword}
                onChange={manejarCambio}
                fullWidth
                variant="outlined"
                placeholder="Ingresá tu contraseña para cambiar el email"
              />
            )}
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => { setEditando(false); setError(''); setExito(''); setFormulario({ nombre: perfil?.nombre ?? '', apellido: perfil?.apellido ?? '', email: perfil?.email ?? '', currentPassword: '' }) }}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </Stack>
          </Box>
        )}

        {!editando && (
          <Button variant="contained" onClick={() => setEditando(true)} sx={{ alignSelf: 'flex-start' }}>
            Editar datos
          </Button>
        )}

        <Divider sx={{ borderColor: 'divider' }} />

        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2, color: 'text.primary' }}>
            Cuenta
          </Typography>
          {/* Sin cuenta no hay nada que mostrar en esta sección: ni alias, ni CVU, ni saldo.
              El administrador inicial se siembra por SQL sin cuenta, y las cuentas se crean
              al registrarse un usuario. Mostrar los campos vacíos con guiones solo hace
              pensar que faltan datos por cargar. */}
          {!tieneCuenta ? (
            <Alert severity="info">
              El Administrador no tiene una billetera asociada, por lo tanto, no hay campos
              referidos de la cuenta que modificar.
            </Alert>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 1, width: '100%' }}>
              {!editandoAlias ? (
                <>
                  <InfoCard label="Alias" value={perfil?.cuenta?.alias ?? '-'} alignRight />
                  <Button variant="contained" onClick={() => setEditandoAlias(true)} sx={{ alignSelf: 'flex-start' }}>
                    Editar alias
                  </Button>
                </>
              ) : (
                <Box component="form" onSubmit={guardarAlias} sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    label="Alias"
                    name="alias"
                    value={alias}
                    onChange={event => {
                      setAlias(event.target.value)
                      setErrorAlias('')
                    }}
                    fullWidth
                    variant="outlined"
                    error={Boolean(errorAlias)}
                    helperText={errorAlias || 'Tres palabras separadas por puntos, por ejemplo auto.perro.gato'}
                  />
                  <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditandoAlias(false)
                        setAlias(perfil?.cuenta?.alias ?? '')
                        setError('')
                        setErrorAlias('')
                        setExito('')
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" variant="contained" disabled={guardando}>
                      {guardando ? 'Guardando...' : 'Guardar alias'}
                    </Button>
                  </Stack>
                </Box>
              )}
              <InfoCard
                label="CVU"
                value={perfil?.cuenta?.cvu ?? '-'}
                alignRight
               
              />
              {mostrarSaldo && (
                <InfoCard
                  label="Saldo disponible"
                  value={formatoPesos.format(saldo)}
                  alignRight
                 
                />
              )}
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  )
}