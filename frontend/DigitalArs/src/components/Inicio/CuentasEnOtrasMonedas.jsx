import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import ChipProximamente from '../Proximamente/ChipProximamente'
import TituloDeSeccion from './TituloDeSeccion'

// Fila con scroll horizontal de cuentas en otras monedas. Cada tarjeta ocupa el 75% del ancho
// para que asome la siguiente: así se entiende sin explicación que hay más deslizando.
// Hoy todas son de muestra (la API tiene una sola cuenta, en pesos).
export default function CuentasEnOtrasMonedas({ cuentas, onElegir }) {
  return (
    <Box component="section" aria-labelledby="titulo-otras-cuentas">
      <TituloDeSeccion id="titulo-otras-cuentas">Otras cuentas</TituloDeSeccion>

      {/* La barra de scroll se oculta: en el teléfono no se usa (se desliza con el dedo) y en
          una ventana angosta de escritorio aparecía como una franja blanca en modo noche. Que
          se puede deslizar ya lo dice la tarjeta siguiente asomando. */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          pb: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {cuentas.map(({ id, nombre, descripcion, Icono }) => (
          <Card
            key={id}
            variant="outlined"
            sx={{ flex: '0 0 75%', scrollSnapAlign: 'start' }}
          >
            <CardActionArea onClick={onElegir} sx={{ p: 2, height: '100%' }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main' }}>
                  <Icono aria-hidden="true" />
                </Avatar>
                <ChipProximamente />
              </Stack>

              <Typography sx={{ fontWeight: 700, mt: 1.5 }}>{nombre}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {descripcion}
              </Typography>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
