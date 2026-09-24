import Typography from '@mui/material/Typography'
import NumberFlow from '@number-flow/react'

// El formato Intl vive dentro del prop `format`: NumberFlow lo pasa tal cual a
// Intl.NumberFormat, así que es el mismo resultado que ya usaba
// `formatoPesos.format(...)` en Dashboard.jsx, pero animado dígito por dígito.
const FORMATO_PESOS_ARGENTINOS = { style: 'currency', currency: 'ARS' }

// El saldo de la cuenta, con una transición animada cuando cambia. Envuelve a NumberFlow y no
// se usa directo en el Dashboard para que el resto de la app no necesite conocer esa librería:
// si el día de mañana se cambia de paquete, este es el único archivo que se toca.
//
// respectMotionPreference es true por defecto en la librería: a quien prefiere sin animaciones
// (prefers-reduced-motion) el número le cambia de una, sin girar.
export default function SaldoAnimado({ valor }) {
  return (
    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
      <NumberFlow value={valor} locales="es-AR" format={FORMATO_PESOS_ARGENTINOS} />
    </Typography>
  )
}
