import Snackbar from '@mui/material/Snackbar'

// Aviso para todo lo que se ve en pantalla pero todavía no existe en la app (Cuentas, Tarjetas,
// QR, Ayuda...). Un botón que no responde parece roto; uno deshabilitado ni se entiende por qué
// está. Así el usuario toca, se entera y sigue.
//
// Va abajo pero por encima de la barra inferior, para que no quede tapado por ella. El aviso de
// notificaciones sale arriba, así que los dos nunca se pisan.
//
// Los 96px son justo para esquivar esa barra, que solo existe por debajo de "md": desde ahí el
// aviso vuelve a su separación normal, o quedaría flotando lejos del borde sin motivo.
export default function AvisoProximamente({ open, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={2500}
      onClose={onClose}
      message="Próximamente disponible"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 96, md: 24 } }}
    />
  )
}
