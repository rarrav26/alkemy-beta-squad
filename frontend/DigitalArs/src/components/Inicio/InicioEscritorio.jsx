import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddRounded from '@mui/icons-material/AddRounded'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'
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

// Ancho máximo del contenido. Sin tope, en un monitor grande la tarjeta de saldo se estiraría
// hasta perder la forma de tarjeta y el ojo tendría que barrer toda la pantalla para leer una
// fila de movimiento.
const ANCHO_MAXIMO = 1200

// La pantalla de Inicio en escritorio. Usa EXACTAMENTE los mismos componentes de sección que la
// mobile: lo único que cambia es la grilla que los ubica. Eso es a propósito — dos juegos de
// componentes para la misma sección terminan divergiendo, y un arreglo aparece en una vista y no
// en la otra.
//
// Tampoco carga datos ni abre los modales de dinero: eso sigue en Dashboard, que se lo pasa por
// props, igual que a InicioMobile.
export default function InicioEscritorio({
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

  // El cuarto atajo es Tarjetas y no "Mi perfil" como en mobile: acá Perfil ya tiene su propia
  // fila en la barra lateral, así que repetirlo como atajo no agregaría nada.
  const atajosReales = [
    { id: 'ingresar', etiqueta: 'Ingresar', Icono: AddRounded, onClick: onAgregar },
    { id: 'transferir', etiqueta: 'Transferir', Icono: SwapHorizRounded, onClick: onTransferir },
    { id: 'movimientos', etiqueta: 'Movimientos', Icono: ReceiptLongRounded, onClick: () => navegar('/movimientos') },
    { id: 'tarjetas', etiqueta: 'Mi tarjeta', Icono: CreditCardRounded, onClick: () => navegar('/tarjetas') }
  ]

  // Todo lo de muestra responde igual: avisa que todavía no está disponible.
  function mostrarAviso() {
    setAvisoAbierto(true)
  }

  const atajosDeMuestra = ATAJOS_DE_MUESTRA.map(atajo => ({ ...atajo, onClick: mostrarAviso }))

  return (
    <Box sx={{ maxWidth: ANCHO_MAXIMO, mx: 'auto', px: 4, pt: 1, pb: 4 }} aria-busy={cargando}>
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

          {/* Dos columnas: a la izquierda lo que el usuario vino a hacer (saldo, atajos,
              movimientos), a la derecha el riel con lo que todavía no existe. Recién desde "lg",
              porque entre md y lg la ventana no da para dos columnas legibles y una sola queda
              mejor que dos angostas. minmax(0, …) y no 2fr/1fr sueltos: sin el mínimo en 0 una
              fila de movimiento larga ensancha su columna y descuadra la grilla. */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
              gap: 3,
              alignItems: 'start'
            }}
          >
            <Stack spacing={3}>
              <Aparicion orden={0}>
                <TarjetaDeSaldo
                  cuenta={cuenta}
                  etiquetaDeVariacion={ETIQUETA_DE_VARIACION_DE_MUESTRA}
                  onAgregar={onAgregar}
                  onTransferir={onTransferir}
                />
              </Aparicion>

              <Aparicion orden={1}>
                <GrillaDeAtajos atajos={[...atajosReales, ...atajosDeMuestra]} />
              </Aparicion>

              {/* Seis y no cuatro como en mobile: acá hay alto para mostrarlos sin que la
                  página crezca, y el historial se entiende mejor con más filas. */}
              <Aparicion orden={2}>
                <UltimosMovimientos saldo={cuenta.saldo} cantidad={6} />
              </Aparicion>
            </Stack>

            {/* El riel arranca un paso detrás de la columna principal: lo importante entra
                primero, y lo de muestra después. */}
            <Stack spacing={3}>
              <Aparicion orden={1}>
                <PromoCredito promo={PROMO_DE_CREDITO_DE_MUESTRA} onElegir={mostrarAviso} />
              </Aparicion>

              {/* En columna solo acá: el riel es angosto y se usa con mouse, y ahí la fila que se
                  desliza dejaba la segunda tarjeta cortada y sin forma de alcanzarla. Con el dedo
                  la fila sí funciona, así que en mobile se mantiene. */}
              <Aparicion orden={2}>
                <CuentasEnOtrasMonedas cuentas={CUENTAS_DE_MUESTRA} onElegir={mostrarAviso} enColumna />
              </Aparicion>

              <Aparicion orden={3}>
                <BannerPromocional banner={BANNER_DE_MUESTRA} onElegir={mostrarAviso} />
              </Aparicion>
            </Stack>
          </Box>
        </Stack>
      )}

      <AvisoProximamente open={avisoAbierto} onClose={() => setAvisoAbierto(false)} />
    </Box>
  )
}
