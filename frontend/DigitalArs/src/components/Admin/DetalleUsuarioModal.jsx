import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography
} from '@mui/material'
import { obtenerUsuarioPorId } from '../../context/api'

const formatoPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS'
})

// Mismo bloque label/valor que ya usa EditarUsuarioModal para el documento no editable.
function Dato({ label, value }) {
  return (
    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  )
}

// El detalle se busca al abrir, con id: el listado (UsuarioAdminItemDto) no trae alias ni CVU,
// así que hace falta un GET aparte por usuario en vez de reusar la fila de la tabla.
export default function DetalleUsuarioModal({ open, usuarioId, token, onClose }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !usuarioId) return

    const controller = new AbortController()

    async function cargarDetalle() {
      setCargando(true)
      setError('')
      setUsuario(null)

      try {
        const datos = await obtenerUsuarioPorId({ token, id: usuarioId, signal: controller.signal })
        if (!controller.signal.aborted) setUsuario(datos)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || 'No se pudo obtener el detalle del usuario.')
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false)
      }
    }

    cargarDetalle()

    return () => controller.abort()
  }, [open, usuarioId, token])

  const documento = usuario ? [usuario.tipoDocumento, usuario.nroDocumento].filter(Boolean).join(' ') : ''

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="detalle-usuario-titulo">
      <DialogTitle id="detalle-usuario-titulo">Detalle del usuario</DialogTitle>

      <DialogContent>
        {cargando && (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!cargando && error && <Alert severity="error">{error}</Alert>}

        {!cargando && !error && usuario && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Dato label="Nombre y apellido" value={`${usuario.nombre} ${usuario.apellido}`} />
            <Dato label="Documento" value={documento} />
            <Dato label="Email" value={usuario.email} />

            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Estado
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={usuario.isActive ? 'Activo' : 'Desactivado'}
                  color={usuario.isActive ? 'success' : 'default'}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Box>

            <Divider />

            {usuario.cuenta ? (
              <>
                <Dato label="Alias" value={usuario.cuenta.alias} />
                <Dato label="CVU" value={usuario.cuenta.cvu} />
                <Dato label="Saldo" value={formatoPesos.format(usuario.cuenta.saldo)} />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Este usuario no tiene una cuenta asociada.
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
