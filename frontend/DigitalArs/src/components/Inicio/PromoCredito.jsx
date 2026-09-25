import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'

import ChipProximamente from '../Proximamente/ChipProximamente'

// El degradé sale de los dos tonos del color principal del tema, así cambia solo con el modo
// día/noche. El texto va en primary.contrastText, que MUI elige para que se lea sobre ese color:
// oscuro sobre el celeste del modo noche, blanco sobre el azul del modo día.
function degradeDelColorPrincipal(theme) {
  return `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
}

// Promo de tarjeta de crédito, de muestra: la app todavía no tiene crédito.
export default function PromoCredito({ promo, onElegir }) {
  return (
    <Card
      component="section"
      aria-labelledby="titulo-promo-credito"
      elevation={0}
      sx={{ background: degradeDelColorPrincipal, color: 'primary.contrastText' }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Avatar sx={{ bgcolor: 'background.paper', color: 'primary.main' }}>
            <CreditCardRounded aria-hidden="true" />
          </Avatar>
          <ChipProximamente />
        </Stack>

        <Typography id="titulo-promo-credito" component="h2" variant="h6" sx={{ fontWeight: 700, mt: 2 }}>
          {promo.titulo}
        </Typography>
        <Typography variant="body2">{promo.descripcion}</Typography>

        <Button
          variant="contained"
          disableElevation
          onClick={onElegir}
          sx={{
            mt: 2,
            bgcolor: 'background.paper',
            color: 'primary.main',
            '&:hover': { bgcolor: 'background.default' }
          }}
        >
          {promo.accion}
        </Button>
      </CardContent>
    </Card>
  )
}
