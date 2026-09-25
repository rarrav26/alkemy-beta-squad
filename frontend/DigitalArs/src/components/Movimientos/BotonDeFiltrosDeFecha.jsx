import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import TuneRounded from '@mui/icons-material/TuneRounded'

function etiquetaDelBoton(cantidadDeFechas) {
  if (cantidadDeFechas === 0) return 'Filtrar por fecha'
  if (cantidadDeFechas === 1) return 'Filtrar por fecha, 1 fecha aplicada'
  return `Filtrar por fecha, ${cantidadDeFechas} fechas aplicadas`
}

// El botón redondo al lado del buscador. El globito cuenta las fechas puestas: es la única
// pista, con la hoja cerrada, de que la lista está filtrada por fecha.
export default function BotonDeFiltrosDeFecha({ cantidadDeFechas, onClick }) {
  return (
    <IconButton
      onClick={onClick}
      aria-label={etiquetaDelBoton(cantidadDeFechas)}
      aria-haspopup="dialog"
      sx={{ width: 48, height: 48, flexShrink: 0, border: 1, borderColor: 'divider' }}
    >
      <Badge badgeContent={cantidadDeFechas} color="primary">
        <TuneRounded />
      </Badge>
    </IconButton>
  )
}
