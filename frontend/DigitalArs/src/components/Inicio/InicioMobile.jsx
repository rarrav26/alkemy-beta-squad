import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddRounded from '@mui/icons-material/AddRounded'
import PersonRounded from '@mui/icons-material/PersonRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'
import { useNavigate } from 'react-router-dom'

import { MovimientosPreview } from '../../routes/Movimientos'
import AliasYCvuDialog from '../Cuentas/AliasYCvuDialog'
import EstadoDeCargaDeCuenta from '../Cuentas/EstadoDeCargaDeCuenta'
import AvisoProximamente from '../Proximamente/AvisoProximamente'
import { ATAJOS_DE_MUESTRA } from './datosDeMuestra'
import GrillaDeAtajos from './GrillaDeAtajos'
import TarjetaDeSaldo from './TarjetaDeSaldo'

// El título de la página existe para el lector de pantalla, pero no se dibuja: en mobile el
// encabezado ya saluda al usuario y repetir "Inicio" arriba de la tarjeta solo ocupa lugar.
const OCULTO_A_LA_VISTA = {
  position: 'absolute',
  // En texto y no como número: en sx, `width: 1` significa 100%, no 1px.
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap'
}

// La pantalla de Inicio en mobile. No carga datos ni abre los modales de dinero: eso sigue en
// Dashboard, que se lo pasa por props. Así las dos vistas usan la misma cuenta y los mismos
// modales, y esta solo decide cómo se ve.
export default function InicioMobile({
  cuenta,
  cargando,
  error,
  onReintentar,
  mensajeExito,
  onCerrarMensajeExito,
  onAgregar,
  onTransferir
}) {
  const navegar = useNavigate()
  const [aliasYCvuAbierto, setAliasYCvuAbierto] = useState(false)
  const [avisoAbierto, setAvisoAbierto] = useState(false)

  const atajosReales = [
    { id: 'ingresar', etiqueta: 'Ingresar', Icono: AddRounded, onClick: onAgregar },
    { id: 'transferir', etiqueta: 'Transferir', Icono: SwapHorizRounded, onClick: onTransferir },
    { id: 'movimientos', etiqueta: 'Movimientos', Icono: ReceiptLongRounded, onClick: () => navegar('/movimientos') },
    { id: 'perfil', etiqueta: 'Mi perfil', Icono: PersonRounded, onClick: () => navegar('/perfil') }
  ]

  const atajosDeMuestra = ATAJOS_DE_MUESTRA.map(atajo => ({
    ...atajo,
    onClick: () => setAvisoAbierto(true)
  }))

  return (
    <Box sx={{ px: 2, pt: 1, pb: 2 }} aria-busy={cargando}>
      <Typography component="h1" sx={OCULTO_A_LA_VISTA}>
        Inicio
      </Typography>

      <EstadoDeCargaDeCuenta cargando={cargando} error={error} onReintentar={onReintentar} />

      {cuenta && (
        <Stack spacing={3}>
          {mensajeExito && (
            <Alert severity="success" onClose={onCerrarMensajeExito}>
              {mensajeExito}
            </Alert>
          )}

          <TarjetaDeSaldo
            saldo={cuenta.saldo}
            onAgregar={onAgregar}
            onTransferir={onTransferir}
            onVerAliasYCvu={() => setAliasYCvuAbierto(true)}
          />

          <GrillaDeAtajos atajos={[...atajosReales, ...atajosDeMuestra]} />
        </Stack>
      )}

      {cuenta && <MovimientosPreview />}

      {cuenta && (
        <AliasYCvuDialog
          open={aliasYCvuAbierto}
          onClose={() => setAliasYCvuAbierto(false)}
          alias={cuenta.alias}
          cvu={cuenta.cvu}
        />
      )}

      <AvisoProximamente open={avisoAbierto} onClose={() => setAvisoAbierto(false)} />
    </Box>
  )
}
