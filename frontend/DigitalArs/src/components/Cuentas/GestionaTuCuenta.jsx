import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'

import TituloDeSeccion from '../Comunes/TituloDeSeccion'
import ChipProximamente from '../Proximamente/ChipProximamente'

// "Gestioná tu cuenta": accesos a funciones que todavía no existen. Toda la sección es de
// muestra, así que el chip va una sola vez junto al título y cada opción muestra el aviso.
export default function GestionaTuCuenta({ opciones, onElegir }) {
  return (
    <Box component="section" aria-labelledby="titulo-gestiona-tu-cuenta">
      <TituloDeSeccion id="titulo-gestiona-tu-cuenta" complemento={<ChipProximamente />}>
        Gestioná tu cuenta
      </TituloDeSeccion>

      <Card variant="outlined">
        <List disablePadding>
          {opciones.map(({ id, titulo, descripcion, Icono }, indice) => (
            <ListItemButton
              key={id}
              onClick={onElegir}
              divider={indice < opciones.length - 1}
              sx={{ py: 1.5, gap: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'text.primary' }}>
                <Icono aria-hidden="true" />
              </ListItemIcon>

              <ListItemText
                primary={titulo}
                secondary={descripcion}
                slotProps={{ primary: { sx: { fontWeight: 600 } } }}
              />

              <ChevronRightRounded aria-hidden="true" sx={{ color: 'primary.main' }} />
            </ListItemButton>
          ))}
        </List>
      </Card>
    </Box>
  )
}
