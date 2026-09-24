import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import Atajo from './Atajo'

// Grilla de 4 columnas con los accesos rápidos. Solo dibuja: qué atajos hay y qué hace cada uno
// lo decide quien la usa, así sirve igual para atajos reales y de muestra.
export default function GrillaDeAtajos({ atajos }) {
  return (
    <Box component="section" aria-labelledby="titulo-tus-atajos">
      <Typography id="titulo-tus-atajos" component="h2" variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Tus atajos
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', rowGap: 2, columnGap: 1 }}>
        {atajos.map(atajo => (
          <Atajo
            key={atajo.id}
            etiqueta={atajo.etiqueta}
            Icono={atajo.Icono}
            insignia={atajo.insignia}
            onClick={atajo.onClick}
          />
        ))}
      </Box>
    </Box>
  )
}
