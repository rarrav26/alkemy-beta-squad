import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography
} from '@mui/material'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import { obtenerResumenDeTarjetas } from '../../context/api'

const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS'
})

// El texto y el color de cada evento de la bitácora. El color comunica el tipo de un vistazo:
// rojo para lo que bloquea o termina la tarjeta, verde para lo que la habilita.
//
// Las claves tienen que coincidir con TipoDeEventoDeTarjeta del backend, que a su vez coincide
// con el CHECK CK_TarjetaEventos_Tipo. Es el mismo criterio que notificacionesUtils.js: un valor
// que llega del servidor como texto se repite acá como constante y no suelto en cada lugar.
const EVENTOS = {
  GENERADA: { texto: 'Generada', color: 'info' },
  CONGELADA: { texto: 'Congelada', color: 'warning' },
  DESCONGELADA: { texto: 'Descongelada', color: 'success' },
  DADA_DE_BAJA: { texto: 'Dada de baja', color: 'error' }
}

const ESTADOS = {
  ACTIVA: { texto: 'Activa', color: 'success' },
  CONGELADA: { texto: 'Congelada', color: 'warning' }
}

function formatearFecha(iso) {
  // La fecha llega con el huso incluido desde el backend, así que se muestra tal cual.
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Actividad de tarjetas de un usuario, para el administrador.
 *
 * Se carga A DEMANDA con un botón y no al abrir el detalle: la mayoría de las veces el admin
 * abre el detalle para ver otra cosa, y así no se gasta una llamada que nadie pidió.
 *
 * Los contadores cuentan TODO el historial; la bitácora muestra los últimos 20 eventos.
 */
export default function ActividadDeTarjetas({ usuarioId, token }) {
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function cargar() {
    setCargando(true)
    setError('')

    try {
      const datos = await obtenerResumenDeTarjetas({ token, usuarioId })
      setResumen(datos)
    } catch (fallo) {
      setError(fallo.message || 'No se pudo obtener la actividad de tarjetas.')
    } finally {
      setCargando(false)
    }
  }

  if (!resumen) {
    return (
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Button
          variant="outlined"
          startIcon={cargando ? <CircularProgress size={16} /> : <CreditCardIcon />}
          onClick={cargar}
          disabled={cargando}
          fullWidth
        >
          {cargando ? 'Cargando…' : 'Ver movimientos de tarjeta'}
        </Button>
      </Box>
    )
  }

  const estado = resumen.estadoActual ? ESTADOS[resumen.estadoActual] : null

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" color="text.secondary">
        Actividad de tarjetas
      </Typography>

      <Box
        sx={{
          display: 'grid',
          // Dos columnas desde el ancho más chico: son valores cortos y cuatro filas apiladas
          // ocuparían todo el modal.
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1
        }}
      >
        <Contador etiqueta="Tarjetas generadas" valor={resumen.tarjetasGeneradas} />
        <Contador etiqueta="Veces que congeló" valor={resumen.vecesQueCongelo} />
        <Contador etiqueta="Veces que descongeló" valor={resumen.vecesQueDescongelo} />
        <Contador etiqueta="Dadas de baja" valor={resumen.tarjetasDadasDeBaja} />
        <Contador etiqueta="Pagos realizados" valor={resumen.pagosRealizados} />
        <Contador etiqueta="Total pagado" valor={formatoPesos.format(resumen.totalPagado)} />
      </Box>

      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Tarjeta actual
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          {estado ? (
            <Chip
              label={estado.texto}
              color={estado.color}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Typography variant="body2">
              {/* Se distingue "nunca tuvo" de "tuvo y la dio de baja": con los contadores en la
                  mano, decir solo "no tiene" perdería esa diferencia. */}
              {resumen.tarjetasGeneradas > 0
                ? 'Sin tarjeta vigente'
                : 'Nunca generó una tarjeta'}
            </Typography>
          )}
        </Box>
      </Box>

      {resumen.eventos.length > 0 && (
        <>
          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            Historial
          </Typography>

          <Stack spacing={1}>
            {resumen.eventos.map((evento, indice) => {
              const definicion = EVENTOS[evento.tipo] ?? {
                texto: evento.tipo,
                color: 'default'
              }

              return (
                <Stack
                  // El backend no manda id de evento, así que la clave combina los campos que
                  // lo identifican. El índice se suma porque dos eventos pueden compartir
                  // fecha y tipo si se registraron en el mismo milisegundo.
                  key={`${evento.fecha}-${evento.tipo}-${indice}`}
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                    <Chip
                      label={definicion.texto}
                      color={definicion.color}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      •••• {evento.ultimosCuatro}
                    </Typography>
                  </Stack>

                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {formatearFecha(evento.fecha)}
                  </Typography>
                </Stack>
              )
            })}
          </Stack>
        </>
      )}
    </Stack>
  )
}

function Contador({ etiqueta, valor }) {
  return (
    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {etiqueta}
      </Typography>
      <Typography variant="subtitle1" fontWeight={600}>
        {valor}
      </Typography>
    </Box>
  )
}
