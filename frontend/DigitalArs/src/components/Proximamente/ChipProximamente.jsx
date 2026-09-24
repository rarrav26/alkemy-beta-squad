import Chip from '@mui/material/Chip'

// La marca que llevan todos los elementos de muestra del Inicio: le avisa al usuario que eso
// todavía no funciona antes de que lo toque.
//
// Tiene fondo propio (background.paper) para leerse igual sobre una tarjeta común que sobre
// el degradé de color de la promo de crédito, en los dos temas.
export default function ChipProximamente() {
  return (
    <Chip
      label="Próximamente"
      size="small"
      variant="outlined"
      sx={{ bgcolor: 'background.paper', color: 'text.secondary', fontWeight: 600 }}
    />
  )
}
