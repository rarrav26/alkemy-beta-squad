import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'

// Los valores son los que acepta el parámetro ?tipo= de la API (ver opcionesTipo en
// movimientosUtils). Las etiquetas son más cortas que las del filtro de escritorio para que
// los tres chips entren en una fila del teléfono.
const CHIPS_DE_TIPO = [
  { valor: 'todas', etiqueta: 'Todos' },
  { valor: 'credito', etiqueta: 'Ingresos' },
  { valor: 'debito', etiqueta: 'Egresos' }
]

// Filtro rápido por tipo. El elegido va relleno; el resto, solo con borde. aria-pressed le
// dice al lector de pantalla cuál está activo.
export default function ChipsDeTipo({ tipoElegido, onElegir }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      role="group"
      aria-label="Filtrar por tipo"
      sx={{
        overflowX: 'auto',
        pb: 0.5,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' }
      }}
    >
      {CHIPS_DE_TIPO.map(({ valor, etiqueta }) => {
        const elegido = valor === tipoElegido

        return (
          <Chip
            key={valor}
            label={etiqueta}
            clickable
            onClick={() => onElegir(valor)}
            color={elegido ? 'primary' : 'default'}
            variant={elegido ? 'filled' : 'outlined'}
            aria-pressed={elegido}
            sx={{ height: 40, px: 1, borderRadius: 999, fontWeight: 600, flexShrink: 0 }}
          />
        )
      })}
    </Stack>
  )
}
