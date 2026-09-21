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
  Typography
} from '@mui/material'
import { useAuth } from '../context/authContext'
import { ElementosGlobales } from '../context/ElementosGlobales'
import { getSessionUser } from './dashboardUtils'

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
  const { obtenerMiPerfil, session } = useAuth()
  const { darkMode } = useContext(ElementosGlobales)
  const usuario = getSessionUser(session)
  const esAdmin = usuario?.role === 'Administrador'
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function cargarPerfil() {
      setCargando(true)
      setError('')
      setPerfil(null)

      try {
        const datos = await obtenerMiPerfil(controller.signal)
        if (!controller.signal.aborted) setPerfil(datos)
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

      <Stack spacing={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 0.5, width: '100%' }}>
          <InfoCard label="Nombre" value={perfil?.nombre ?? '-'} alignRight darkMode={darkMode} />
          <InfoCard label="Apellido" value={perfil?.apellido ?? '-'} alignRight darkMode={darkMode} />
          <InfoCard label="Tipo de documento" value={perfil?.tipoDocumento ?? '-'} alignRight darkMode={darkMode} />
          <InfoCard label="Número de documento" value={perfil?.nroDocumento ?? '-'} alignRight darkMode={darkMode} />
          <InfoCard label="Email" value={perfil?.email ?? '-'} alignRight darkMode={darkMode} />
          <InfoCard
            label="Estado"
            value={
              <Chip
                label={perfil?.isActive ? 'Activo' : 'Inactivo'}
                color={perfil?.isActive ? 'success' : 'default'}
                size="small"
                variant="outlined"
              />
            }
            alignRight
            darkMode={darkMode}
          />
        </Box>

        <Divider sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />

        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2, color: darkMode ? '#f5f5f5' : '#111827' }}>
            Cuenta
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr' }, gap: 1, width: '100%' }}>
            <InfoCard label="Alias" value={perfil?.cuenta?.alias ?? '-'} alignRight darkMode={darkMode} />
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