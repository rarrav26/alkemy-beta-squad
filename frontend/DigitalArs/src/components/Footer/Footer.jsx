import { Box, Typography } from '@mui/material'

// Solo se ve en las pantallas públicas (login, registro), que son las únicas que usan la cáscara
// clásica.
//
// Sin borde arriba: detrás hay un fondo animado, y una línea cruzando la pantalla sobre los rayos
// se leía como una costura. La separación la da el espacio.
export default function Footer() {
  return (
    <Box component="footer" sx={{ py: 3, px: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">© 2026 DigitalArs · Squad 2</Typography>
    </Box>
  )
}
