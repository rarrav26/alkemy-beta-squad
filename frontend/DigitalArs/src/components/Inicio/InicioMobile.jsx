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

import { OCULTO_A_LA_VISTA } from '../Comunes/ocultoALaVista'
import Aparicion from '../Comunes/Aparicion'
import EstadoDeCargaDeCuenta from '../Cuentas/EstadoDeCargaDeCuenta'
import UltimosMovimientos from '../Movimientos/UltimosMovimientos'
import AvisoProximamente from '../Proximamente/AvisoProximamente'
import {
  ATAJOS_DE_MUESTRA,
  BANNER_DE_MUESTRA,
  CUENTAS_DE_MUESTRA,
  ETIQUETA_DE_VARIACION_DE_MUESTRA,
  PROMO_DE_CREDITO_DE_MUESTRA
} from '../Proximamente/datosDeMuestra'
import BannerPromocional from './BannerPromocional'
import CuentasEnOtrasMonedas from './CuentasEnOtrasMonedas'
import GrillaDeAtajos from './GrillaDeAtajos'
import PromoCredito from './PromoCredito'
import TarjetaDeSaldo from './TarjetaDeSaldo'

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
  const [avisoAbierto, setAvisoAbierto] = useState(false)

  const atajosReales = [
    { id: 'ingresar', etiqueta: 'Ingresar', Icono: AddRounded, onClick: onAgregar },
    { id: 'transferir', etiqueta: 'Transferir', Icono: SwapHorizRounded, onClick: onTransferir },
    { id: 'movimientos', etiqueta: 'Movimientos', Icono: ReceiptLongRounded, onClick: () => navegar('/movimientos') },
    { id: 'perfil', etiqueta: 'Mi perfil', Icono: PersonRounded, onClick: () => navegar('/perfil') }
  ]

  // Todo lo de muestra responde igual: avisa que todavía no está disponible.
  function mostrarAviso() {
    setAvisoAbierto(true)
  }

  const atajosDeMuestra = ATAJOS_DE_MUESTRA.map(atajo => ({ ...atajo, onClick: mostrarAviso }))

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

          {/* Las secciones se arman una atrás de la otra. El saldo va primero y sin retardo: es
              lo que el usuario vino a ver, y hacerlo esperar a que aparezca sería cobrarle la
              animación. El resto entra detrás. */}
          <Aparicion orden={0}>
            <TarjetaDeSaldo
              cuenta={cuenta}
              etiquetaDeVariacion={ETIQUETA_DE_VARIACION_DE_MUESTRA}
              onAgregar={onAgregar}
              onTransferir={onTransferir}
            />
          </Aparicion>

          <Aparicion orden={1}>
            <CuentasEnOtrasMonedas cuentas={CUENTAS_DE_MUESTRA} onElegir={mostrarAviso} />
          </Aparicion>

          <Aparicion orden={2}>
            <GrillaDeAtajos atajos={[...atajosReales, ...atajosDeMuestra]} />
          </Aparicion>

          <Aparicion orden={3}>
            <PromoCredito promo={PROMO_DE_CREDITO_DE_MUESTRA} onElegir={mostrarAviso} />
          </Aparicion>

          <Aparicion orden={4}>
            <BannerPromocional banner={BANNER_DE_MUESTRA} onElegir={mostrarAviso} />
          </Aparicion>

          <Aparicion orden={5}>
            <UltimosMovimientos saldo={cuenta.saldo} cantidad={4} />
          </Aparicion>
        </Stack>
      )}

      <AvisoProximamente open={avisoAbierto} onClose={() => setAvisoAbierto(false)} />
    </Box>
  )
}
