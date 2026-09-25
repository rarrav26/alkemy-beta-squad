import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'

import ChipProximamente from '../Proximamente/ChipProximamente'
import TituloDeSeccion from './TituloDeSeccion'

// Una opción de la lista. Las de muestra llevan su propio chip "Próximamente" (en una lista
// que mezcla opciones reales y de muestra, el chip del título mentiría sobre las reales). Las
// peligrosas, como dar de baja la tarjeta, van en rojo para que se distingan antes de tocarlas.
function OpcionDeGestion({ opcion, conDivisor }) {
  const { titulo, descripcion, Icono, onClick, proximamente = false, peligrosa = false } = opcion
  const color = peligrosa ? 'error.main' : 'text.primary'

  return (
    <ListItemButton onClick={onClick} divider={conDivisor} sx={{ py: 1.5, gap: 1 }}>
      <ListItemIcon sx={{ minWidth: 40, color }}>
        <Icono aria-hidden="true" />
      </ListItemIcon>

      <ListItemText
        primary={titulo}
        secondary={descripcion}
        slotProps={{ primary: { sx: { fontWeight: 600, color } } }}
      />

      {proximamente && <ChipProximamente />}

      <ChevronRightRounded aria-hidden="true" sx={{ color: peligrosa ? 'error.main' : 'primary.main' }} />
    </ListItemButton>
  )
}

// Sección de opciones en lista, con ícono, título, descripción y flecha ("Gestioná tu cuenta",
// "Gestioná tu tarjeta"). Cada opción trae su propio onClick. El complemento es opcional y va
// junto al título (por ejemplo, el chip "Próximamente" cuando TODA la sección es de muestra).
export default function ListaDeGestion({ titulo, idDelTitulo, opciones, complemento }) {
  return (
    <Box component="section" aria-labelledby={idDelTitulo}>
      <TituloDeSeccion id={idDelTitulo} complemento={complemento}>
        {titulo}
      </TituloDeSeccion>

      <Card variant="outlined">
        <List disablePadding>
          {opciones.map((opcion, indice) => (
            <OpcionDeGestion
              key={opcion.id}
              opcion={opcion}
              conDivisor={indice < opciones.length - 1}
            />
          ))}
        </List>
      </Card>
    </Box>
  )
}
