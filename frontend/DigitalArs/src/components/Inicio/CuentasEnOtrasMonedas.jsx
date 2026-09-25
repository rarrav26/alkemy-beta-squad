import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import ChipProximamente from '../Proximamente/ChipProximamente'
import TituloDeSeccion from '../Comunes/TituloDeSeccion'

// Fila con scroll horizontal: cada tarjeta ocupa el 75% del ancho para que asome la siguiente,
// así se entiende sin explicación que hay más deslizando.
//
// La barra de scroll se oculta: en el teléfono no se usa (se desliza con el dedo) y en una
// ventana angosta de escritorio aparecía como una franja blanca en modo noche. Que se puede
// deslizar ya lo dice la tarjeta siguiente asomando.
const EN_FILA_QUE_SE_DESLIZA = {
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  pb: 1,
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' }
}

const TARJETA_QUE_ASOMA = { flex: '0 0 75%', scrollSnapAlign: 'start' }

// Cuentas en otras monedas. Hoy todas son de muestra (la API tiene una sola cuenta, en pesos).
//
// Dos disposiciones, y la diferencia no es estética. Con el dedo, la fila que se desliza funciona
// y además anuncia que hay más: ahí se queda. Con MOUSE no, y por eso `enColumna` existe — en el
// riel de escritorio la segunda tarjeta aparecía cortada contra el borde y era inalcanzable,
// porque la fila esconde su barra de scroll y la rueda del mouse no desplaza en horizontal.
// Apiladas se ven enteras y no hace falta ningún gesto.
export default function CuentasEnOtrasMonedas({ cuentas, onElegir, enColumna = false }) {
  return (
    <Box component="section" aria-labelledby="titulo-otras-cuentas">
      <TituloDeSeccion id="titulo-otras-cuentas">Otras cuentas</TituloDeSeccion>

      <Stack
        direction={enColumna ? 'column' : 'row'}
        spacing={1.5}
        sx={enColumna ? undefined : EN_FILA_QUE_SE_DESLIZA}
      >
        {cuentas.map(({ id, nombre, descripcion, Icono }) => (
          <Card key={id} variant="outlined" sx={enColumna ? undefined : TARJETA_QUE_ASOMA}>
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
