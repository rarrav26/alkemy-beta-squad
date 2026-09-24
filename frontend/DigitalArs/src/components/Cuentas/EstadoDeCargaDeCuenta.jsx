import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// Lo que se muestra mientras la cuenta no está lista: el aviso de carga o el error con su
// botón de reintento. Lo comparten el Dashboard de escritorio y el Inicio mobile, así los dos
// dicen lo mismo. Cuando la cuenta ya cargó no dibuja nada.
export default function EstadoDeCargaDeCuenta({ cargando, error, onReintentar }) {
  if (cargando) {
    return <Typography role="status">Cargando tu cuenta…</Typography>
  }

  if (!error) return null

  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onReintentar}>
          Reintentar
        </Button>
      }
    >
      {error}
    </Alert>
  )
}
