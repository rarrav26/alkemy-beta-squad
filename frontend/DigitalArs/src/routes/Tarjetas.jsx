import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Pantalla "Tus tarjetas" del usuario regular. En el MVP hay una sola tarjeta virtual por
// cuenta.
export default function TarjetasPage() {
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: { xs: 2, md: 4 }, pb: 3 }}>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
        Tus tarjetas
      </Typography>
    </Box>
  )
}
