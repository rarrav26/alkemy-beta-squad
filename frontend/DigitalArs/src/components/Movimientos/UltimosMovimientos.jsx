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
function ContenidoDeLaLista({ cargando, error, movimientos }) {
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
        Todavía no tenés movimientos en tu cuenta.
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

// Sección "Movimientos" de las pantallas mobile (Inicio y Cuentas): los últimos movimientos y
// un acceso al historial completo. Recibe el saldo solo para saber cuándo recargar (ver
// useUltimosMovimientos).
export default function UltimosMovimientos({ saldo, cantidad = 4 }) {
  const { movimientos, cargando, error } = useUltimosMovimientos({ cantidad, saldo })

  return (
    <Box component="section" aria-labelledby="titulo-ultimos-movimientos">
      <TituloDeSeccion id="titulo-ultimos-movimientos">Movimientos</TituloDeSeccion>

      <Card variant="outlined">
        <CardContent sx={{ py: 0.5, '&:last-child': { pb: 1.5 } }} aria-busy={cargando}>
          <ContenidoDeLaLista cargando={cargando} error={error} movimientos={movimientos} />

          {/* El aria-label completa el "Ver más" para quien navega por links: fuera de la
              tarjeta, "Ver más" solo no dice de qué. */}
          <Link
            component={LinkDeRouter}
            to="/movimientos"
            underline="always"
            aria-label="Ver más movimientos"
            sx={{ display: 'inline-block', mt: 1, fontWeight: 600 }}
          >
            Ver más
          </Link>
        </CardContent>
      </Card>
    </Box>
  )
}
