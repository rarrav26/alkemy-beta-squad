import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

// La baja es irreversible, así que se confirma. El texto dice explícitamente que no se puede
// deshacer, porque "¿estás seguro?" no informa nada. Lo usan el Dashboard de escritorio y la
// pantalla Tarjetas de mobile.
export default function ConfirmarBajaDeTarjetaDialog({ open, onClose, onConfirmar, ultimosCuatro }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Dar de baja la tarjeta</DialogTitle>
      <DialogContent>
        <DialogContentText>
          La tarjeta terminada en {ultimosCuatro} va a quedar inutilizable de forma permanente. No
          se puede reactivar ni descongelar. Después vas a poder generar una nueva.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onConfirmar} color="error" variant="contained">
          Dar de baja
        </Button>
      </DialogActions>
    </Dialog>
  )
}
