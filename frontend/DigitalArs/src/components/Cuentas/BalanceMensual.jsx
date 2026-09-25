import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import ChipProximamente from '../Proximamente/ChipProximamente'

// Montos redondos, sin centavos: es un resumen del mes, no un comprobante.
const formatoPesosSinCentavos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
})

function porcentajeDeIngresos({ ingresos, gastos }) {
  const total = ingresos + gastos
  if (total === 0) return 0
  return Math.round((ingresos / total) * 100)
}

// El anillo es un conic-gradient: el color de ingresos ocupa su porcentaje de la vuelta y el
// de gastos el resto. Los colores salen del tema, así cambian solos con el modo día/noche.
function fondoDeLaDona(porcentaje) {
  return theme =>
    `conic-gradient(${theme.palette.primary.main} 0 ${porcentaje}%, ${theme.palette.warning.main} ${porcentaje}% 100%)`
}

function Dona({ porcentaje }) {
  return (
    <Box
      role="img"
      aria-label={`Ingresos ${porcentaje}% y gastos ${100 - porcentaje}% del mes. Datos de muestra.`}
      sx={{
        width: 112,
        height: 112,
        flexShrink: 0,
        borderRadius: '50%',
        background: fondoDeLaDona(porcentaje),
        display: 'grid',
        placeItems: 'center'
      }}
    >
      {/* El agujero del centro: un círculo del color de la tarjeta. */}
      <Box sx={{ width: '58%', height: '58%', borderRadius: '50%', bgcolor: 'background.paper' }} />
    </Box>
  )
}

function ItemDeLeyenda({ color, etiqueta, monto }) {
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box aria-hidden="true" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {etiqueta}
        </Typography>
      </Stack>
      <Typography sx={{ fontWeight: 700 }}>{formatoPesosSinCentavos.format(monto)}</Typography>
    </Box>
  )
}

// "Tu balance mensual": ingresos contra gastos del mes. Hoy es de muestra (la API no calcula
// el balance): se marca con el chip y "Consultar detalle" solo avisa que todavía no está.
export default function BalanceMensual({ balance, onElegir }) {
  const porcentaje = porcentajeDeIngresos(balance)

  return (
    <Card component="section" variant="outlined" aria-labelledby="titulo-balance-mensual">
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography id="titulo-balance-mensual" component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
            Tu balance mensual
          </Typography>
          <ChipProximamente />
        </Stack>

        <Stack direction="row" spacing={3} sx={{ alignItems: 'center', mt: 2 }}>
          <Dona porcentaje={porcentaje} />

          <Stack spacing={1.5} divider={<Divider flexItem />} sx={{ flexGrow: 1, minWidth: 0 }}>
            <ItemDeLeyenda color="primary.main" etiqueta="Ingresos" monto={balance.ingresos} />
            <ItemDeLeyenda color="warning.main" etiqueta="Gastos" monto={balance.gastos} />
          </Stack>
        </Stack>

        <Divider sx={{ mt: 2, mb: 1.5 }} />

        <Link component="button" type="button" underline="always" onClick={onElegir} sx={{ fontWeight: 600 }}>
          Consultar detalle
        </Link>
      </CardContent>
    </Card>
  )
}
