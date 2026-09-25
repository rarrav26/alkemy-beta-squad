import { useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { actualizarUsuarioAdmin } from '../../context/api'

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// El formulario arranca con los datos actuales del usuario. No hace falta sincronizar props
// con estado en un efecto: quien la usa le pasa una `key` distinta por usuario, así React
// remonta el componente y el estado inicial se vuelve a tomar de las props.
export default function EditarUsuarioModal({ open, usuario, token, onClose, onUsuarioActualizado }) {
  const [nombre, setNombre] = useState(usuario?.nombre || '')
  const [apellido, setApellido] = useState(usuario?.apellido || '')
  const [email, setEmail] = useState(usuario?.email || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  // Error atribuible a un campo concreto. Un solo Alert arriba obliga al administrador a
  // adivinar qué corregir; marcar el campo lleva el ojo directo al problema.
  const [errorPorCampo, setErrorPorCampo] = useState({})
  const envioEnCurso = useRef(false)

  function cerrar() {
    if (envioEnCurso.current) return
    setError('')
    onClose()
  }

  async function guardar(event) {
    event.preventDefault()
    if (envioEnCurso.current) return

    const nombreLimpio = nombre.trim()
    const apellidoLimpio = apellido.trim()
    const emailLimpio = email.trim()

    if (!nombreLimpio || !apellidoLimpio) {
      setErrorPorCampo({
        nombre: nombreLimpio ? '' : 'El nombre es obligatorio.',
        apellido: apellidoLimpio ? '' : 'El apellido es obligatorio.'
      })
      return
    }

    if (!FORMATO_EMAIL.test(emailLimpio)) {
      setErrorPorCampo({ email: 'Ingresá un email válido.' })
      return
    }

    envioEnCurso.current = true
    setGuardando(true)
    setError('')
    setErrorPorCampo({})

    try {
      const actualizado = await actualizarUsuarioAdmin({
        token,
        id: usuario.usuarioId || usuario.id,
        nombre: nombreLimpio,
        apellido: apellidoLimpio,
        email: emailLimpio
      })

      if (onUsuarioActualizado) onUsuarioActualizado(actualizado)
      onClose()
    } catch (err) {
      const mensaje = err.message || 'No se pudo actualizar el usuario.'

      // El rechazo más común es el email duplicado, y el backend lo dice en el mensaje. Se
      // marca el campo responsable en vez de dejar el aviso suelto arriba del formulario.
      if (/email/i.test(mensaje)) {
        setErrorPorCampo({ email: mensaje })
      } else {
        setError(mensaje)
      }
    } finally {
      envioEnCurso.current = false
      setGuardando(false)
    }
  }

  const documento = [usuario?.tipoDocumento, usuario?.nroDocumento].filter(Boolean).join(' ')

  return (
    <Dialog open={open} onClose={cerrar} fullWidth maxWidth="xs" aria-labelledby="editar-usuario-titulo">
      <form onSubmit={guardar}>
        <DialogTitle id="editar-usuario-titulo">Editar usuario</DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              autoFocus
              fullWidth
              label="Nombre"
              value={nombre}
              disabled={guardando}
              error={Boolean(errorPorCampo.nombre)}
              helperText={errorPorCampo.nombre || ' '}
              onChange={e => {
                setNombre(e.target.value)
                setError('')
                setErrorPorCampo({})
              }}
            />

            <TextField
              fullWidth
              label="Apellido"
              value={apellido}
              disabled={guardando}
              error={Boolean(errorPorCampo.apellido)}
              helperText={errorPorCampo.apellido || ' '}
              onChange={e => {
                setApellido(e.target.value)
                setError('')
                setErrorPorCampo({})
              }}
            />

            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              disabled={guardando}
              error={Boolean(errorPorCampo.email)}
              helperText={errorPorCampo.email || 'Es también el usuario con el que inicia sesión.'}
              onChange={e => {
                setEmail(e.target.value)
                setError('')
                setErrorPorCampo({})
              }}
            />

            {/* El documento se muestra pero no se edita: es un dato que esta historia no
                permite modificar, y ocultarlo dejaría al administrador sin saber a quién edita. */}
            {documento && (
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Documento (no editable):
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {documento}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button type="button" onClick={cerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
