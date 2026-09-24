import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Pantalla "Tus cuentas" del usuario regular. En el MVP hay una sola cuenta, en pesos.
export default function CuentasPage() {
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: 2, pb: 3 }}>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
        Tus cuentas
      </Typography>
    </Box>
  )
}
