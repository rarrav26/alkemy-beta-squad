import Typography from '@mui/material/Typography'
import NumberFlow from '@number-flow/react'

// El formato Intl vive dentro del prop `format`: NumberFlow lo pasa tal cual a
// Intl.NumberFormat, así que es el mismo resultado que ya usaba
// `formatoPesos.format(...)` en Dashboard.jsx, pero animado dígito por dígito.
const FORMATO_PESOS_ARGENTINOS = { style: 'currency', currency: 'ARS' }
const formatoPesos = new Intl.NumberFormat('es-AR', FORMATO_PESOS_ARGENTINOS)

// El saldo de la cuenta, con una transición animada cuando cambia. Envuelve a NumberFlow y no
// se usa directo en el Dashboard para que el resto de la app no necesite conocer esa librería:
// si el día de mañana se cambia de paquete, este es el único archivo que se toca.
//
// respectMotionPreference es true por defecto en la librería: a quien prefiere sin animaciones
// (prefers-reduced-motion) el número le cambia de una, sin girar.
//
// role="img" + aria-label: NumberFlow arma el número con columnas de dígitos que giran, y el
// lector de pantalla leía "1 5 . 0 0 0" dígito por dígito (y en plena animación, las columnas
// "0 1 2 3 4 5 6 7 8 9"). Así se anuncia el monto entero, "$ 15.000,00", y lo animado queda
// como decoración.
export default function SaldoAnimado({ valor }) {
  return (
    <Typography
      variant="h4"
      component="div"
      role="img"
      aria-label={formatoPesos.format(valor)}
      sx={{ fontWeight: 700 }}
    >
      <NumberFlow value={valor} locales="es-AR" format={FORMATO_PESOS_ARGENTINOS} />
    </Typography>
  )
}
