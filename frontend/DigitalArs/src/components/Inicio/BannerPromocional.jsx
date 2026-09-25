import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CardGiftcardRounded from '@mui/icons-material/CardGiftcardRounded'

import ChipProximamente from '../Proximamente/ChipProximamente'

// Banner horizontal de una promoción, de muestra. Toda la tarjeta es el botón: en el teléfono
// es más fácil de tocar que un link chico adentro.
export default function BannerPromocional({ banner, onElegir }) {
  return (
    <Card variant="outlined">
      <CardActionArea onClick={onElegir} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'action.hover', color: 'primary.main' }}>
            <CardGiftcardRounded aria-hidden="true" />
          </Avatar>

          {/* Párrafos y no un h2: un título no puede ir adentro de un botón. */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>{banner.titulo}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {banner.descripcion}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ mt: 1.5 }}>
          <ChipProximamente />
        </Box>
      </CardActionArea>
    </Card>
  )
}
