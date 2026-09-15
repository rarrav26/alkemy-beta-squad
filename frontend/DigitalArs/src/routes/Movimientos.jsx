import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/authContext'


const tipoMovimientoMap = {
  DEPOSITO: 'Depósito',
  TRANSFERENCIA_ENVIADA: 'Transferencia enviada',
  TRANSFERENCIA_RECIBIDA: 'Transferencia recibida',
  RETIRO: 'Retiro',
  PAGO: 'Pago'
}

const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS'
})

function normalizarMovimiento(movimiento, index = 0) {
  const tipo = (movimiento.tipo ?? '').toUpperCase()
  const signo = (movimiento.signo ?? 'DEBITO').toUpperCase()
  const importe = Number(movimiento.importe ?? 0)

  return {
    id: movimiento.id ?? index + 1,
    fecha: movimiento.fecha ?? new Date().toISOString(),
    tipo,
    signo,
    importe,
    descripcion: tipoMovimientoMap[tipo] ?? 'Movimiento',
    esCredito: signo === 'CREDITO',
    etiqueta: `${tipoMovimientoMap[tipo] ?? 'Movimiento'} · ${new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(movimiento.fecha ?? Date.now()))}`
  }
}

export function getTipoMovimientoLabel(tipoMovimientoId) {
  return tipoMovimientoMap[tipoMovimientoId] ?? 'Movimiento'
}

export function formatearFecha(fecha) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(fecha))
}

export function MovimientosPreview() {
  const { obtenerMovimientos } = useAuth()
  const [movimientos, setMovimientos] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function cargarPreview() {
      try {
        const response = await obtenerMovimientos(controller.signal, { page: 1, pageSize: 5 })
        const items = response?.items ?? []

        if (!controller.signal.aborted) {
          setMovimientos(items.map(normalizarMovimiento))
          setError('')
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setMovimientos([])
          setError(error.message)
        }
      }
    }

    cargarPreview()
    return () => controller.abort()
  }, [obtenerMovimientos])

  const datos = movimientos

  return (
    <Paper variant='outlined' sx={{ p: 3, mt: 3 }}>
      <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
        <Box>
          <Typography variant='overline' color='primary'>Historial</Typography>
          <Typography variant='h6' fontWeight={700}>Últimos movimientos</Typography>
        </Box>
        <Button component={Link} to='/movimientos' variant='text'>Ver todos</Button>
      </Stack>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Stack spacing={1.5}>
        {datos.slice(0, 5).map(movimiento => {
          const esCredito = movimiento.signo === 'CREDITO' || movimiento.esCredito

          return (
            <Box
              key={movimiento.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1.6fr 1fr auto' },
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1.25,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                backgroundColor: 'background.paper'
              }}
            >
              <Box>
                <Typography fontWeight={600}>{movimiento.descripcion}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {formatearFecha(movimiento.fecha)}
                </Typography>
              </Box>

              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ textAlign: { xs: 'left', sm: 'right' } }}
              >
                {movimiento.tipo}
              </Typography>

              <Typography
                fontWeight={700}
                sx={{
                  color: esCredito ? 'success.main' : 'text.primary',
                  textAlign: { xs: 'left', sm: 'right' }
                }}
              >
                {esCredito ? '+' : '-'}{formatoPesos.format(Math.abs(movimiento.importe))}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </Paper>
  )
}

export function MovimientosPage() {
  const { obtenerMovimientos } = useAuth()
  const [movimientos, setMovimientos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function cargarMovimientos() {
      setCargando(true)
      setError('')

      try {
        const response = await obtenerMovimientos(controller.signal, { page: 1, pageSize: 10 })
        const items = response?.items ?? []

        if (!controller.signal.aborted) {
          setMovimientos(items.map(normalizarMovimiento))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setMovimientos([])
          setError(error.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false)
        }
      }
    }

    cargarMovimientos()

    return () => controller.abort()
  }, [obtenerMovimientos])

  const movimientosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    if (!texto) return movimientos

    return movimientos.filter(movimiento => {
      const tipo = (movimiento.tipo ?? '').toLowerCase()
      const descripcion = (movimiento.descripcion ?? '').toLowerCase()
      const fecha = formatearFecha(movimiento.fecha).toLowerCase()
      const signo = (movimiento.signo ?? '').toLowerCase()

      return [tipo, descripcion, fecha, signo].some(valor => valor.includes(texto))
    })
  }, [busqueda, movimientos])

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', p: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant='overline' color='primary'>Movimientos</Typography>
          <Typography component='h1' variant='h3' fontWeight={700}>Historial completo</Typography>
        </Box>

        {error && (
          <Alert severity='error'>{error}</Alert>
        )}

        <Paper variant='outlined' sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            label='Buscar movimiento'
            placeholder='Por tipo, signo o fecha'
            value={busqueda}
            onChange={event => setBusqueda(event.target.value)}
          />
        </Paper>

        <Paper variant='outlined' sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            {cargando ? (
              <Typography color='text.secondary'>Cargando movimientos…</Typography>
            ) : movimientosFiltrados.length === 0 ? (
              <Typography color='text.secondary'>No se encontraron movimientos para tu búsqueda.</Typography>
            ) : (
              movimientosFiltrados.map(movimiento => {
                const esCredito = movimiento.signo === 'CREDITO' || movimiento.esCredito

                return (
                  <Box
                    key={movimiento.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1.5fr 1fr auto' },
                      gap: 1,
                      px: 1.5,
                      py: 1.4,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700}>{movimiento.descripcion}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {formatearFecha(movimiento.fecha)}
                      </Typography>
                    </Box>

                    <Typography variant='body2' color='text.secondary'>
                      {movimiento.tipo}
                    </Typography>

                    <Typography
                      fontWeight={700}
                      sx={{
                        color: esCredito ? 'success.main' : 'text.primary',
                        textAlign: { xs: 'left', sm: 'right' }
                      }}
                    >
                      {esCredito ? '+' : '-'}{formatoPesos.format(Math.abs(movimiento.importe))}
                    </Typography>
                  </Box>
                )
              })
            )}
          </Stack>
        </Paper>

        <Button component={Link} to='/dashboard' variant='outlined' sx={{ alignSelf: 'flex-start' }}>
          Volver al dashboard
        </Button>
      </Stack>
    </Box>
  )
}

export default MovimientosPage
