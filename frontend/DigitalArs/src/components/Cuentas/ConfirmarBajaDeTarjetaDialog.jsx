import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import BotonConfirmarManteniendo from '../Comunes/BotonConfirmarManteniendo'

// La baja es irreversible, así que se confirma. El texto dice explícitamente que no se puede
// deshacer, porque "¿estás seguro?" no informa nada. Lo usan el Dashboard de escritorio y la
// pantalla Tarjetas de mobile.
export default function ConfirmarBajaDeTarjetaDialog({ open, onClose, onConfirmar, ultimosCuatro }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      aria-labelledby="baja-tarjeta-titulo" aria-describedby="baja-tarjeta-descripcion">
      <DialogTitle id="baja-tarjeta-titulo">Dar de baja la tarjeta</DialogTitle>
      <DialogContent>
        <DialogContentText id="baja-tarjeta-descripcion">
          La tarjeta terminada en {ultimosCuatro} va a quedar inutilizable de forma permanente. No
          se puede reactivar ni descongelar. Después vas a poder generar una nueva.
        </DialogContentText>
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Mantené presionado 2 segundos para confirmar. Si soltás antes, se cancela.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap', rowGap: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        {/* Al cerrar se desmonta: cancela el temporizador incluso durante la salida del modal. */}
        {open && <BotonConfirmarManteniendo
          key={ultimosCuatro}
          onConfirmar={onConfirmar}
          icon={<DeleteOutlineRounded fontSize="small" />}
        >
          Mantener para dar de baja
        </BotonConfirmarManteniendo>}
      </DialogActions>
    </Dialog>
  )
}
