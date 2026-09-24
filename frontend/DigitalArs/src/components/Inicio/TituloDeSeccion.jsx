import Typography from '@mui/material/Typography'

// El título de cada sección del Inicio ("Tus atajos", "Otras cuentas"...). Recibe el id para
// que la sección lo use en aria-labelledby y el lector de pantalla la anuncie por su nombre.
export default function TituloDeSeccion({ id, children }) {
  return (
    <Typography id={id} component="h2" variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
      {children}
    </Typography>
  )
}
