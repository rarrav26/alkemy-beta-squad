import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

// El título de cada sección de las pantallas mobile ("Tus atajos", "Movimientos"...). Recibe
// el id para que la sección lo use en aria-labelledby y el lector de pantalla la anuncie por
// su nombre. El complemento es opcional y va a la derecha del título (por ejemplo, el chip
// "Próximamente" de una sección de muestra).
export default function TituloDeSeccion({ id, children, complemento }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
      <Typography id={id} component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
        {children}
      </Typography>
      {complemento}
    </Stack>
  )
}
