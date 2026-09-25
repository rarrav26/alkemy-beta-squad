import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded'

function DatoCopiable({ nombre, valor, onCopiar }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {nombre}
        </Typography>
        {/* El CVU son 22 dígitos seguidos: sin esto desborda la pantalla del teléfono. */}
        <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{valor}</Typography>
      </Stack>

      <IconButton aria-label={`Copiar ${nombre}`} onClick={() => onCopiar(nombre, valor)}>
        <ContentCopyRounded />
      </IconButton>
    </Stack>
  )
}

// Los datos que el usuario le pasa a otra persona para recibir dinero, con un botón para
// copiar cada uno. Lo abre la acción "Alias y CVU" de la tarjeta de saldo.
export default function AliasYCvuDialog({ open, onClose, alias, cvu }) {
  const [resultadoDeCopia, setResultadoDeCopia] = useState(null)

  // Mismo criterio que el código de invitación en NewUserPage: el portapapeles puede fallar
  // (permisos del navegador, página sin HTTPS) y en ese caso se le indica copiarlo a mano.
  async function copiar(nombre, valor) {
    try {
      await navigator.clipboard.writeText(valor)
      setResultadoDeCopia({ severidad: 'success', mensaje: `${nombre} copiado.` })
    } catch {
      setResultadoDeCopia({ severidad: 'info', mensaje: 'Seleccioná el dato y copialo manualmente.' })
    }
  }

  function cerrar() {
    setResultadoDeCopia(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={cerrar} fullWidth maxWidth="xs">
      <DialogTitle>Tus datos para recibir dinero</DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          <DatoCopiable nombre="Alias" valor={alias} onCopiar={copiar} />
          <DatoCopiable nombre="CVU" valor={cvu} onCopiar={copiar} />

          {resultadoDeCopia && (
            <Alert severity={resultadoDeCopia.severidad} role="status">
              {resultadoDeCopia.mensaje}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={cerrar}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
