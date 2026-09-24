import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { useNavigate } from 'react-router-dom'

import useHistorialMobile from '../../hooks/useHistorialMobile'
import { hayFiltrosAplicados } from '../../routes/movimientosUtils'
import BotonDeFiltrosDeFecha from './BotonDeFiltrosDeFecha'
import BuscadorDeMovimientos from './BuscadorDeMovimientos'
import ChipsDeTipo from './ChipsDeTipo'
import FilaDeMovimientoCompacta from './FilaDeMovimientoCompacta'
import HojaDeFiltrosDeFecha from './HojaDeFiltrosDeFecha'

// React Router guarda en el historial del navegador cuántas pantallas se recorrieron dentro
// de la app (idx). Si es 0, se entró directo a esta URL: "volver" con el navegador sacaría al
// usuario de la app, así que se lo lleva al inicio.
function hayPantallaAnteriorEnLaApp() {
  return (window.history.state?.idx ?? 0) > 0
}

// Qué se ve en la zona de la lista. Returns tempranos en vez de condiciones anidadas.
function ContenidoDelHistorial({ historial, onLimpiar }) {
  if (historial.cargando) {
    return (
      <Typography role="status" sx={{ color: 'text.secondary', py: 3 }}>
        Cargando movimientos…
      </Typography>
    )
  }

  // El error va antes que el vacío: si la carga falló, no sabemos si hay movimientos.
  if (historial.error) {
    return <Alert severity="error" sx={{ my: 2 }}>{historial.error}</Alert>
  }

  if (historial.movimientos.length === 0) {
    return <HistorialVacio historial={historial} onLimpiar={onLimpiar} />
  }

  return (
    <List disablePadding>
      {historial.movimientos.map((movimiento, indice) => (
        <FilaDeMovimientoCompacta
          key={movimiento.id}
          movimiento={movimiento}
          conDivisor={indice < historial.movimientos.length - 1}
        />
      ))}
    </List>
  )
}

// Sin resultados por culpa de un filtro, se ofrece quitarlo: si no, parece que el usuario no
// tiene movimientos.
function HistorialVacio({ historial, onLimpiar }) {
  if (!hayFiltrosAplicados(historial.filtrosAplicados)) {
    return (
      <Typography sx={{ color: 'text.secondary', py: 3 }}>
        Todavía no tenés movimientos en tu cuenta.
      </Typography>
    )
  }

  return (
    <Stack spacing={1} sx={{ py: 3, alignItems: 'flex-start' }}>
      <Typography sx={{ color: 'text.secondary' }}>
        No hay movimientos que coincidan con los filtros.
      </Typography>
      <Button onClick={onLimpiar} sx={{ px: 0 }}>
        Limpiar filtros
      </Button>
    </Stack>
  )
}

// "Cargar más" al final de la lista. Desaparece cuando ya no quedan movimientos por traer.
function CargarMas({ historial }) {
  if (historial.cargando || historial.error || !historial.hayMas) return null

  return (
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      {historial.errorAlCargarMas && <Alert severity="error">{historial.errorAlCargarMas}</Alert>}

      <Button
        variant="outlined"
        fullWidth
        onClick={historial.cargarMas}
        disabled={historial.cargandoMas}
        sx={{ borderRadius: 999, py: 1.25, fontWeight: 700 }}
      >
        {historial.cargandoMas ? 'Cargando…' : 'Cargar más'}
      </Button>
    </Stack>
  )
}

// Historial completo de movimientos en mobile: volver, título, buscador, chips de tipo y la
// lista que crece con "Cargar más". Los datos y los filtros viven en useHistorialMobile.
export default function HistorialMobile() {
  const navegar = useNavigate()
  const historial = useHistorialMobile()
  const [textoDeBusqueda, setTextoDeBusqueda] = useState('')
  const [hojaDeFechasAbierta, setHojaDeFechasAbierta] = useState(false)

  const { desde, hasta } = historial.filtrosAplicados
  const cantidadDeFechas = [desde, hasta].filter(Boolean).length

  function limpiarFiltros() {
    setTextoDeBusqueda('')
    historial.limpiarFiltros()
  }

  function volver() {
    if (hayPantallaAnteriorEnLaApp()) {
      navegar(-1)
      return
    }
    navegar('/dashboard')
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: 1, pb: 3 }}>
      <IconButton edge="start" aria-label="Volver" onClick={volver} sx={{ color: 'primary.main' }}>
        <ArrowBackRounded />
      </IconButton>

      <Typography component="h1" variant="h5" sx={{ fontWeight: 700, mt: 1, mb: 2 }}>
        Movimientos
      </Typography>

      <Stack spacing={2} sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <BuscadorDeMovimientos
            texto={textoDeBusqueda}
            onCambiarTexto={setTextoDeBusqueda}
            onBuscar={historial.aplicarBusqueda}
          />
          <BotonDeFiltrosDeFecha
            cantidadDeFechas={cantidadDeFechas}
            onClick={() => setHojaDeFechasAbierta(true)}
          />
        </Stack>
        <ChipsDeTipo tipoElegido={historial.filtrosAplicados.tipo} onElegir={historial.elegirTipo} />
      </Stack>

      <Box aria-busy={historial.cargando}>
        <ContenidoDelHistorial historial={historial} onLimpiar={limpiarFiltros} />
      </Box>

      <CargarMas historial={historial} />

      <HojaDeFiltrosDeFecha
        open={hojaDeFechasAbierta}
        onClose={() => setHojaDeFechasAbierta(false)}
        desde={desde}
        hasta={hasta}
        onAplicar={historial.aplicarFechas}
      />
    </Box>
  )
}
