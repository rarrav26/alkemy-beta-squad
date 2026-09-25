import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'

// Mismas medidas que TarjetaVisual (proporción de una tarjeta real y ancho máximo), así la
// silueta ocupa el lugar exacto donde va a aparecer la tarjeta cuando se genere.
const PROPORCION = '1.586 / 1'
const ANCHO_MAXIMO = 380

// Lo que se ve cuando el usuario todavía no tiene tarjeta, o acaba de dar de baja la que
// tenía: la silueta punteada de una tarjeta y el botón para generar una.
export default function TarjetaVacia({ onGenerar, generando, error, onCerrarError }) {
  return (
    <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center' }}>
      <Box
        aria-hidden="true"
        sx={{
          width: '100%',
          maxWidth: ANCHO_MAXIMO,
          aspectRatio: PROPORCION,
          borderRadius: 3,
          border: '2px dashed',
          borderColor: 'divider',
          display: 'grid',
          placeItems: 'center',
          color: 'text.secondary'
        }}
      >
        <CreditCardRounded sx={{ fontSize: 56 }} />
      </Box>

      <Typography sx={{ color: 'text.secondary', maxWidth: 320 }}>
        Generá tu tarjeta virtual para tener un medio de pago asociado a tu cuenta.
      </Typography>

      {error && (
        <Alert severity="error" onClose={onCerrarError} sx={{ width: '100%' }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        disableElevation
        onClick={onGenerar}
        disabled={generando}
        sx={{ borderRadius: 999, px: 4, py: 1.25, fontWeight: 700 }}
      >
        {generando ? 'Generando…' : 'Generar tarjeta'}
      </Button>
    </Stack>
  )
}
