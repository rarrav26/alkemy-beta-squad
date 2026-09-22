import { useContext, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useAuth } from '../context/authContext'
import { ElementosGlobales } from '../context/ElementosGlobales'
import { getSessionUser } from './dashboardUtils'
import { buildAliasPayload, buildProfilePayload } from './perfilUtils'

const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS'
})

function InfoCard({ label, value, alignRight = false, darkMode = true }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 2,
        borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
        backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
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
              color: darkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)',
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
              color: darkMode ? '#f5f5f5' : '#111827',
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
  const { darkMode } = useContext(ElementosGlobales)
  const usuario = getSessionUser(session)
  const esAdmin = usuario?.role === 'Administrador'
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
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
          setError(
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

    const aliasTrim = alias.trim()
    if (!aliasTrim) {
      setError('El alias no puede estar vacío.')
      return
    }

    setGuardando(true)
    setError('')
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
      setError(error.message || 'No se pudo guardar el alias.')
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

  if (error) {
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
          {error}
        </Alert>
      </Box>
    )
  }

  const saldo = perfil?.cuenta?.saldo ?? 0
  const mostrarSaldo = esAdmin

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: 'auto',
        p: { xs: 2.5, md: 4 },
        backgroundColor: darkMode ? '#0d1117' : '#f8fafc',
        borderRadius: 2,
        border: darkMode ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.1)',
        color: darkMode ? '#f5f5f5' : '#111827'
      }}
    >
      <Typography
        variant="h4"
        fontWeight={700}
        sx={{ mb: 3, color: darkMode ? '#f5f5f5' : '#111827', fontFamily: 'sans-serif' }}
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
            <InfoCard label="Nombre" value={perfil?.nombre ?? '-'} alignRight darkMode={darkMode} />
            <InfoCard label="Apellido" value={perfil?.apellido ?? '-'} alignRight darkMode={darkMode} />
            <InfoCard label="Tipo de documento" value={perfil?.tipoDocumento ?? '-'} alignRight darkMode={darkMode} />
            <InfoCard label="Número de documento" value={perfil?.nroDocumento ?? '-'} alignRight darkMode={darkMode} />
            <InfoCard label="Email" value={perfil?.email ?? '-'} alignRight darkMode={darkMode} />
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
            <Stack direction="row" spacing={2} justifyContent="flex-end">
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

        <Divider sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />

        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2, color: darkMode ? '#f5f5f5' : '#111827' }}>
            Cuenta
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 1, width: '100%' }}>
            {!editandoAlias ? (
              <>
                <InfoCard label="Alias" value={perfil?.cuenta?.alias ?? '-'} alignRight darkMode={darkMode} />
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
                  onChange={event => setAlias(event.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditandoAlias(false)
                      setAlias(perfil?.cuenta?.alias ?? '')
                      setError('')
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
              darkMode={darkMode}
            />
            {mostrarSaldo && (
              <InfoCard
                label="Saldo disponible"
                value={formatoPesos.format(saldo)}
                alignRight
                darkMode={darkMode}
              />
            )}
          </Box>
        </Box>
      </Stack>
    </Box>
  )
}