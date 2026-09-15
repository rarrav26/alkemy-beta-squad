import { useRef, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useAuth } from '../../context/authContext'

export default function DepositoModal({ open, onClose, onDepositoRealizado }) {
  const { ingresarDinero } = useAuth()
  const [importe, setImporte] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const envioEnCurso = useRef(false)

  function cerrar() {
    if (envioEnCurso.current) return

    setImporte('')
    setError('')
    onClose()
  }

  async function confirmar(event) {
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

    envioEnCurso.current = true
    setEnviando(true)
    setError('')

    let resultado

    try {
      resultado = await ingresarDinero(valor)
    } catch (error) {
      setError(error.message)
      return
    } finally {
      envioEnCurso.current = false
      setEnviando(false)
    }

    setImporte('')
    onDepositoRealizado(resultado)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={cerrar}
      fullWidth
      maxWidth='xs'
      aria-labelledby='deposito-titulo'
    >
      <form onSubmit={confirmar}>
        <DialogTitle id='deposito-titulo'>Ingresar dinero</DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Typography color='text.secondary'>
              Depósito simulado: el importe se acreditará en tu cuenta de
              DigitalArs.
            </Typography>

            {error && <Alert severity='error'>{error}</Alert>}

            <TextField
              autoFocus
              fullWidth
              label='Importe en pesos'
              value={importe}
              onChange={event => {
                setImporte(event.target.value)
                setError('')
              }}
              disabled={enviando}
              helperText='Mayor a cero, con hasta 2 decimales. Ej.: 1500,50'
              slotProps={{
                htmlInput: { inputMode: 'decimal' }
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>

          <Button
            type='submit'
            variant='contained'
            disabled={enviando || !importe.trim()}
          >
            {enviando ? 'Depositando…' : 'Confirmar depósito'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
