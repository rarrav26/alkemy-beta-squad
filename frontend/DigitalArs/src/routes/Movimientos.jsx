import { useContext, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { ElementosGlobales } from '../context/ElementosGlobales'
import {
  formatearFecha,
  normalizarRespuestaMovimientos,
  opcionesTipo
} from './movimientosUtils'

const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS'
})

export function MovimientosPreview() {
  const { obtenerMovimientos } = useAuth()
  const [movimientos, setMovimientos] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function cargarPreview() {
      try {
        const response = await obtenerMovimientos(undefined, { page: 1, pageSize: 5 })
        if (ignore) return

        const datos = normalizarRespuestaMovimientos(response, 1)
        setMovimientos(datos.items)
        setError('')
      } catch (error) {
        if (ignore) return
        setMovimientos([])
        setError(error.message)
      }
    }

    void cargarPreview()
    const intervalo = window.setInterval(() => {
      void cargarPreview()
    }, 15000)

    return () => {
      ignore = true
      window.clearInterval(intervalo)
    }
  }, [obtenerMovimientos])

  return (
    <Paper variant='outlined' sx={{ p: 3, mt: 3 }}>
      <Stack direction='row' justifyContent='space-between' alignItems='flex-end' sx={{ mb: 2, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant='overline' color='primary'>Historial</Typography>
          <Typography variant='h6' fontWeight={700}>Últimos movimientos</Typography>
        </Box>
        <Button
          component={Link}
          to='/movimientos'
          variant='text'
          sx={{
            minWidth: 0,
            px: 0,
            alignSelf: 'flex-end',
            whiteSpace: 'nowrap'
          }}
        >
          Ver todos
        </Button>
      </Stack>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Stack spacing={1.5}>
        {movimientos.map(movimiento => {
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
  const { darkMode } = useContext(ElementosGlobales)
  const [movimientos, setMovimientos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let ignore = false

    async function cargarMovimientos() {
      setCargando(true)
      setError('')

      try {
        const response = await obtenerMovimientos(undefined, { page: pagina, pageSize })
        if (ignore) return

        const datos = normalizarRespuestaMovimientos(response, pagina)
        setMovimientos(datos.items)
        setTotalPages(datos.totalPages)

        if (pagina > datos.totalPages) {
          setPagina(datos.totalPages || 1)
        }
      } catch (error) {
        if (ignore) return
        setMovimientos([])
        setError(error.message)
      } finally {
        if (!ignore) {
          setCargando(false)
        }
      }
    }

    void cargarMovimientos()
    const intervalo = window.setInterval(() => {
      void cargarMovimientos()
    }, 15000)

    return () => {
      ignore = true
      window.clearInterval(intervalo)
    }
  }, [obtenerMovimientos, pagina, pageSize])

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(movimiento => {
      const tipo = (movimiento.tipo ?? '').toLowerCase()
      const descripcion = (movimiento.descripcion ?? '').toLowerCase()
      const fecha = new Date(movimiento.fecha)
      const fechaTexto = formatearFecha(movimiento.fecha).toLowerCase()
      const signo = (movimiento.signo ?? '').toLowerCase()
      const texto = busqueda.trim().toLowerCase()

      const coincideTexto = !texto || [tipo, descripcion, fechaTexto, signo].some(valor => valor.includes(texto))
      const coincideTipo = !tipoFiltro || tipoFiltro === 'todos' || movimiento.tipo === tipoFiltro

      const fechaDesdeValor = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null
      const fechaHastaValor = fechaHasta ? new Date(`${fechaHasta}T23:59:59`) : null
      const coincideDesde = !fechaDesdeValor || fecha >= fechaDesdeValor
      const coincideHasta = !fechaHastaValor || fecha <= fechaHastaValor

      return coincideTexto && coincideTipo && coincideDesde && coincideHasta
    })
  }, [busqueda, fechaDesde, fechaHasta, movimientos, tipoFiltro])

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
          <Stack spacing={2}>
            <TextField
              fullWidth
              label='Buscar movimiento'
              placeholder='Por tipo, signo o fecha'
              value={busqueda}
              onChange={event => setBusqueda(event.target.value)}
            />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 0.75 }}>
                  Tipo de movimiento
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={tipoFiltro}
                  onChange={event => setTipoFiltro(event.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { height: 56 } }}
                >
                  {opcionesTipo.map(opcion => (
                    <MenuItem key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 0.75 }}>
                  Fecha desde
                </Typography>
                <TextField
                  fullWidth
                  type='date'
                  value={fechaDesde}
                  onChange={event => setFechaDesde(event.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <CalendarMonthOutlinedIcon
                          sx={{
                            color: darkMode ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.62)',
                            fontSize: 22
                          }}
                        />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { height: 56 },
                    '& input': {
                      color: fechaDesde ? 'text.primary' : 'text.secondary'
                    },
                    '& input::-webkit-calendar-picker-indicator': {
                      filter: darkMode ? 'invert(1)' : 'none',
                      opacity: 0.9
                    }
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 0.75 }}>
                  Fecha hasta
                </Typography>
                <TextField
                  fullWidth
                  type='date'
                  value={fechaHasta}
                  onChange={event => setFechaHasta(event.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <CalendarMonthOutlinedIcon
                          sx={{
                            color: darkMode ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.62)',
                            fontSize: 22
                          }}
                        />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { height: 56 },
                    '& input': {
                      color: fechaHasta ? 'text.primary' : 'text.secondary'
                    },
                    '& input::-webkit-calendar-picker-indicator': {
                      filter: darkMode ? 'invert(1)' : 'none',
                      opacity: 0.9
                    }
                  }}
                />
              </Box>
            </Stack>

            {(tipoFiltro || fechaDesde || fechaHasta || busqueda) && (
              <Button
                variant='text'
                color='inherit'
                onClick={() => {
                  setTipoFiltro('')
                  setFechaDesde('')
                  setFechaHasta('')
                  setBusqueda('')
                }}
                sx={{ alignSelf: 'flex-start', px: 0 }}
              >
                Limpiar filtros
              </Button>
            )}
          </Stack>
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

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems='center' spacing={2}>
          <Stack direction='row' spacing={1}>
            <Button variant='outlined' disabled={pagina === 1 || cargando} onClick={() => setPagina(valor => Math.max(1, valor - 1))}>
              Anterior
            </Button>
            <Button variant='outlined' disabled={pagina >= totalPages || cargando} onClick={() => setPagina(valor => Math.min(totalPages, valor + 1))}>
              Siguiente
            </Button>
          </Stack>

          <Stack direction='row' spacing={2} alignItems='center'>
            <TextField
              select
              size='small'
              label='Por página'
              value={pageSize}
              onChange={event => {
                setPageSize(Number(event.target.value))
                setPagina(1)
              }}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
            </TextField>

            <Typography color='text.secondary'>
              Página {pagina} de {totalPages}
            </Typography>
          </Stack>
        </Stack>

        <Button component={Link} to='/dashboard' variant='outlined' sx={{ alignSelf: 'flex-start' }}>
          Volver al dashboard
        </Button>
      </Stack>
    </Box>
  )
}

export default MovimientosPage
