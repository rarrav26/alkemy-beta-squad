import { useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useAuth } from '../../context/authContext'

export default function TransferenciaModal({ open, onClose, onTransferenciaRealizada, saldoDisponible = 0 }) {
  // Las llamadas pasan por el AuthProvider para que un 401 cierre la sesión igual que en el
  // resto de la app, en vez de quedar como un error más dentro del modal.
  const { resolverDestinoDeTransferencia, transferir } = useAuth()

  // Estados del formulario
  const [destino, setDestino] = useState('')
  const [cuentaDestino, setCuentaDestino] = useState(null)
  const [importe, setImporte] = useState('')

  // Estados de control
  const [buscandoDestino, setBuscandoDestino] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const envioEnCurso = useRef(false)

  function limpiarYSalir() {
    if (envioEnCurso.current) return
    setDestino('')
    setCuentaDestino(null)
    setImporte('')
    setError('')
    onClose()
  }

  // Paso 1: Resolver Alias / CVU
  async function buscarDestinatario() {
    const term = destino.trim()
    if (!term) {
      setError('Ingresá un alias o CVU para buscar.')
      return
    }

    setError('')
    setBuscandoDestino(true)
    setCuentaDestino(null)

    try {
      const data = await resolverDestinoDeTransferencia(term)
      setCuentaDestino(data)
    } catch (err) {
      const mensajeCrudo = err.message || 'No se encontró la cuenta destino.'
      // Si vienen líneas repetidas separadas por \n, dejamos solo las únicas
      const mensajeUnico = [...new Set(mensajeCrudo.split('\n'))].join('\n')
      setError(mensajeUnico)
    } finally {
      setBuscandoDestino(false)
    }
  }

  // Paso 2: Confirmar Transferencia con el monto ingresado
  async function confirmarTransferencia(event) {
    event.preventDefault()
    if (envioEnCurso.current) return

    const normalizado = importe.trim().replace(',', '.')

    if (!/^\d+(?:\.\d{1,2})?$/.test(normalizado)) {
      setError('Ingresá un importe válido con hasta 2 decimales.')
      return
    }

    const valor = Number(normalizado)

    if (!Number.isFinite(valor) || valor <= 0) {
      setError('El importe debe ser mayor a cero.')
      return
    }

    if (valor > saldoDisponible) {
      setError(`Saldo insuficiente. Saldo actual: $${saldoDisponible.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`)
      return
    }

    envioEnCurso.current = true
    setEnviando(true)
    setError('')

    try {
      const resultado = await transferir(destino.trim(), valor)

      limpiarYSalir()
      if (onTransferenciaRealizada) onTransferenciaRealizada(resultado)
    } catch (err) {
      setError(err.message || 'Error al procesar la transferencia.')
    } finally {
      envioEnCurso.current = false
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onClose={limpiarYSalir} fullWidth maxWidth="xs" aria-labelledby="transferencia-titulo">
      <form onSubmit={confirmarTransferencia}>
        <DialogTitle id="transferencia-titulo">Nueva Transferencia</DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {/* Input de destino con botón de búsqueda */}
            <Stack direction="row" spacing={1}>
              <TextField
                autoFocus
                fullWidth
                label="Alias o CVU de destino"
                value={destino}
                disabled={enviando || buscandoDestino || Boolean(cuentaDestino)}
                onChange={e => {
                  setDestino(e.target.value)
                  setError('')
                }}
              />
              {!cuentaDestino ? (
                <Button
                  type="button"
                  variant="outlined"
                  onClick={buscarDestinatario}
                  disabled={buscandoDestino || !destino.trim() || enviando}
                  sx={{ minWidth: '95px' }}
                >
                  {buscandoDestino ? <CircularProgress size={22} /> : 'Buscar'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="text"
                  color="secondary"
                  disabled={enviando}
                  onClick={() => {
                    setCuentaDestino(null)
                    setImporte('')
                  }}
                >
                  Cambiar
                </Button>
              )}
            </Stack>

            {/* Paso 2: Se desbloquea únicamente cuando se encontró la cuenta */}
            {cuentaDestino && (
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Destinatario:
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {cuentaDestino.titular || cuentaDestino.nombreCompleto || cuentaDestino.nombre || 'Destino verificado'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CVU/Alias: {cuentaDestino.cvu || cuentaDestino.alias || destino}
                </Typography>
              </Box>
            )}

            {cuentaDestino && (
              <>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  Saldo disponible: <b>${saldoDisponible.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</b>
                </Typography>

                <TextField
                  autoFocus
                  fullWidth
                  label="Importe en pesos a transferir"
                  value={importe}
                  disabled={enviando}
                  onChange={e => {
                    setImporte(e.target.value)
                    setError('')
                  }}
                  helperText="Mayor a cero, con hasta 2 decimales. Ej.: 500,50"
                  slotProps={{
                    htmlInput: { inputMode: 'decimal' }
                  }}
                />
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button type="button" onClick={limpiarYSalir} disabled={enviando || buscandoDestino}>
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={!cuentaDestino || enviando || !importe.trim()}
          >
            {enviando ? 'Transfiriendo…' : 'Confirmar transferencia'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}