import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import { Link as LinkDeRouter } from 'react-router-dom'

import useUltimosMovimientos from '../../hooks/useUltimosMovimientos'
import TituloDeSeccion from '../Comunes/TituloDeSeccion'
import FilaDeMovimientoCompacta from './FilaDeMovimientoCompacta'

// Qué se ve dentro de la tarjeta. Returns tempranos en vez de condiciones anidadas en el JSX.
// El error va antes que el vacío: si la carga falló, no sabemos si el usuario tiene
// movimientos, así que no lo afirmamos.
function ContenidoDeLaLista({ cargando, error, movimientos, mensajeSinMovimientos }) {
  if (cargando) {
    return (
      <Typography role="status" sx={{ color: 'text.secondary', py: 2 }}>
        Cargando movimientos…
      </Typography>
    )
  }

  if (error) {
    return <Alert severity="error" sx={{ my: 1.5 }}>{error}</Alert>
  }

  if (movimientos.length === 0) {
    return (
      <Typography sx={{ color: 'text.secondary', py: 2 }}>
        {mensajeSinMovimientos}
      </Typography>
    )
  }

  return (
    <List disablePadding>
      {movimientos.map((movimiento, indice) => (
        <FilaDeMovimientoCompacta
          key={movimiento.id}
          movimiento={movimiento}
          conDivisor={indice < movimientos.length - 1}
        />
      ))}
    </List>
  )
}

// Sección de últimos movimientos de las pantallas mobile, con un acceso al historial completo.
// Recibe el saldo solo para saber cuándo recargar (ver useUltimosMovimientos).
//
// Por defecto es "Movimientos" con todos los tipos (Inicio y Cuentas). Tarjetas la usa para
// "Tus pagos con tarjeta": cambia el título, filtra con `busqueda` y abre el historial con el
// mismo filtro ya puesto.
export default function UltimosMovimientos({
  saldo,
  cantidad = 4,
  titulo = 'Movimientos',
  idDelTitulo = 'titulo-ultimos-movimientos',
  busqueda = '',
  rutaDeVerMas = '/movimientos',
  mensajeSinMovimientos = 'Todavía no tenés movimientos en tu cuenta.'
}) {
  const { movimientos, cargando, error } = useUltimosMovimientos({ cantidad, saldo, busqueda })

  return (
    <Box component="section" aria-labelledby={idDelTitulo}>
      <TituloDeSeccion id={idDelTitulo}>{titulo}</TituloDeSeccion>

      <Card variant="outlined">
        <CardContent sx={{ py: 0.5, '&:last-child': { pb: 1.5 } }} aria-busy={cargando}>
          <ContenidoDeLaLista
            cargando={cargando}
            error={error}
            movimientos={movimientos}
            mensajeSinMovimientos={mensajeSinMovimientos}
          />

          {/* El aria-label completa el "Ver más" para quien navega por links: fuera de la
              tarjeta, "Ver más" solo no dice de qué. */}
          <Link
            component={LinkDeRouter}
            to={rutaDeVerMas}
            underline="always"
            aria-label={`Ver más: ${titulo}`}
            sx={{ display: 'inline-block', mt: 1, fontWeight: 600 }}
          >
            Ver más
          </Link>
        </CardContent>
      </Card>
    </Box>
  )
}
