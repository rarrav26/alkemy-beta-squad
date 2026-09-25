import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'

// Un acceso con ícono en un círculo y el texto debajo. Lo usan las acciones de la tarjeta de
// saldo y la grilla de atajos, así las dos se ven y responden igual al tocarlas.
//
// Es un botón con texto visible, así que el lector de pantalla lee la etiqueta: el ícono es
// decorativo y se oculta. La insignia es opcional (por ejemplo "20%"): sin ella, el Badge no
// se dibuja. `disabled` lo apaga mientras hay una operación en curso (por ejemplo, congelando
// la tarjeta), para que un segundo toque no dispare otra.
export default function Atajo({ etiqueta, Icono, insignia, onClick, disabled = false }) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        '&.Mui-disabled': { opacity: 0.5 },
        width: '100%',
        flexDirection: 'column',
        gap: 0.75,
        p: 0.5,
        borderRadius: 2,
        transition: 'transform 120ms ease-out',
        // Pequeño "hundimiento" al tocar: en una pantalla táctil no hay hover, y sin esto el
        // usuario no tiene confirmación de que el toque se registró.
        '&:active': { transform: 'scale(0.95)' },
        '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main' }
      }}
    >
      <Badge badgeContent={insignia} color="success" overlap="circular">
        <Avatar sx={{ width: 48, height: 48, bgcolor: 'action.hover', color: 'primary.main' }}>
          <Icono aria-hidden="true" />
        </Avatar>
      </Badge>

      <Typography variant="caption" sx={{ color: 'text.primary', textAlign: 'center', lineHeight: 1.2 }}>
        {etiqueta}
      </Typography>
    </ButtonBase>
  )
}
