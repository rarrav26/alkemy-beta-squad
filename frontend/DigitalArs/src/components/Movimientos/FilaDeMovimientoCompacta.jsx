import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import CallMadeRounded from '@mui/icons-material/CallMadeRounded'
import CallReceivedRounded from '@mui/icons-material/CallReceivedRounded'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'
import SavingsRounded from '@mui/icons-material/SavingsRounded'
import StorefrontRounded from '@mui/icons-material/StorefrontRounded'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'

import {
  descripcionConTarjeta,
  detalleDeLaContraparte,
  formatearFechaCorta,
  textoDelImporte
} from '../../routes/movimientosUtils'

// Un ícono por cada tipo que existe en la tabla Tipo_Movimiento. Si se agrega un tipo nuevo y
// no se suma acá, se muestra con el ícono genérico en vez de romper la fila.
function IconoDelMovimiento({ tipo }) {
  if (tipo === 'DEPOSITO') return <SavingsRounded aria-hidden="true" />
  if (tipo === 'TRANSFERENCIA_ENVIADA') return <CallMadeRounded aria-hidden="true" />
  if (tipo === 'TRANSFERENCIA_RECIBIDA') return <CallReceivedRounded aria-hidden="true" />
  if (tipo === 'PAGO_CON_TARJETA') return <CreditCardRounded aria-hidden="true" />
  if (tipo === 'PAGO_RECIBIDO') return <StorefrontRounded aria-hidden="true" />
  return <SwapHorizRounded aria-hidden="true" />
}

// Lo que entra se destaca en verde; lo que sale va en el color de texto normal, para que la
// lista no quede llena de rojo por movimientos que son habituales (pagar, transferir).
function colorDelImporte(movimiento) {
  if (movimiento.esCredito) return 'success.main'
  return 'text.primary'
}

// Una fila de movimiento en las pantallas mobile (últimos movimientos e historial completo):
// ícono del tipo, fecha arriba, tipo abajo e importe a la derecha. `conDivisor` separa la
// fila de la siguiente (la última no lo lleva).
export default function FilaDeMovimientoCompacta({ movimiento, conDivisor }) {
  // "Para Tomas Destino" / "De Lucia Prueba": solo en transferencias; el resto no lleva línea.
  const detalle = detalleDeLaContraparte(movimiento)

  return (
    <ListItem disableGutters divider={conDivisor} sx={{ gap: 2, py: 1.5 }}>
      <Avatar
        variant="rounded"
        sx={{ width: 40, height: 40, bgcolor: 'action.hover', color: 'text.primary' }}
      >
        <IconoDelMovimiento tipo={movimiento.tipoRaw} />
      </Avatar>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="caption" component="p" sx={{ color: 'text.secondary' }}>
          {formatearFechaCorta(movimiento.fecha)}
        </Typography>
        {/* En un pago suma la tarjeta usada: "Pago con tarjeta •••• 3435". */}
        <Typography noWrap sx={{ fontWeight: 500 }}>
          {descripcionConTarjeta(movimiento)}
        </Typography>
        {detalle && (
          <Typography variant="caption" component="p" noWrap sx={{ color: 'text.secondary' }}>
            {detalle}
          </Typography>
        )}
      </Box>

      <Typography sx={{ fontWeight: 600, whiteSpace: 'nowrap', color: colorDelImporte(movimiento) }}>
        {textoDelImporte(movimiento)}
      </Typography>
    </ListItem>
  )
}
