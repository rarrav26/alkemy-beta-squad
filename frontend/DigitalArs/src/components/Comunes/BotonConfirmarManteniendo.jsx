import { useTheme } from '@mui/material/styles'
import HoldButton from './HoldButton/HoldButton'

// La misma confirmación deliberada para bajas de tarjetas y desactivaciones.
// El padre lo desmonta al cerrar el diálogo para cancelar cualquier presión pendiente.
export default function BotonConfirmarManteniendo({ children, onConfirmar, disabled = false, icon }) {
  const theme = useTheme()
  return <HoldButton
    holdTime={2000}
    resetAfter={0}
    className="hold-button--confirmar"
    onHold={onConfirmar}
    disabled={disabled}
    doneLabel="Procesando…"
    icon={icon}
    backgroundColor={theme.palette.action.hover}
    fillColor={theme.palette.error.main}
    textColor={theme.palette.text.primary}
    fillTextColor={theme.palette.error.contrastText}
    radius={theme.shape.borderRadius}
  >{children}</HoldButton>
}
