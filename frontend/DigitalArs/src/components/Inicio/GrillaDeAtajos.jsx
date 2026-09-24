import Box from '@mui/material/Box'

import Atajo from './Atajo'
import TituloDeSeccion from './TituloDeSeccion'

// Grilla de 4 columnas con los accesos rápidos. Solo dibuja: qué atajos hay y qué hace cada uno
// lo decide quien la usa, así sirve igual para atajos reales y de muestra.
export default function GrillaDeAtajos({ atajos }) {
  return (
    <Box component="section" aria-labelledby="titulo-tus-atajos">
      <TituloDeSeccion id="titulo-tus-atajos">Tus atajos</TituloDeSeccion>

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
