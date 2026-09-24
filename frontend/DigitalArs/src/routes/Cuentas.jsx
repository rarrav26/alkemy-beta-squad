import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import BalanceMensual from '../components/Cuentas/BalanceMensual'
import EstadoDeCargaDeCuenta from '../components/Cuentas/EstadoDeCargaDeCuenta'
import ModalesDeDinero from '../components/Cuentas/ModalesDeDinero'
import TarjetaDeSaldo from '../components/Inicio/TarjetaDeSaldo'
import UltimosMovimientos from '../components/Movimientos/UltimosMovimientos'
import AvisoProximamente from '../components/Proximamente/AvisoProximamente'
import {
  BALANCE_MENSUAL_DE_MUESTRA,
  ETIQUETA_DE_VARIACION_DE_MUESTRA
} from '../components/Proximamente/datosDeMuestra'
import useMiCuenta from '../hooks/useMiCuenta'
import useOperacionesDeDinero from '../hooks/useOperacionesDeDinero'

// Pantalla "Tus cuentas" del usuario regular. En el MVP hay una sola cuenta, en pesos, y se
// muestra con la misma tarjeta que el Inicio: mismo saldo, mismas acciones, mismos modales.
// La ruta ya es solo del usuario regular (Protected rol={ROL_USUARIO}), así que la cuenta se
// pide siempre.
export default function CuentasPage() {
  const { cuenta, cargando, error, reintentar, aplicarDeposito, aplicarTransferencia } =
    useMiCuenta({ habilitado: true })
  const operaciones = useOperacionesDeDinero({ aplicarDeposito, aplicarTransferencia })
  const [avisoAbierto, setAvisoAbierto] = useState(false)

  // Todo lo de muestra responde igual: avisa que todavía no está disponible.
  function mostrarAviso() {
    setAvisoAbierto(true)
  }

  return (
    <Box
      sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: { xs: 2, md: 4 }, pb: 3 }}
      aria-busy={cargando}
    >
      <Typography component="h1" variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Tus cuentas
      </Typography>

      <EstadoDeCargaDeCuenta cargando={cargando} error={error} onReintentar={reintentar} />

      {cuenta && (
        <Stack spacing={3}>
          {operaciones.mensajeExito && (
            <Alert severity="success" onClose={operaciones.cerrarMensajeExito}>
              {operaciones.mensajeExito}
            </Alert>
          )}

          <TarjetaDeSaldo
            cuenta={cuenta}
            etiquetaDeVariacion={ETIQUETA_DE_VARIACION_DE_MUESTRA}
            onAgregar={operaciones.abrirDeposito}
            onTransferir={operaciones.abrirTransferencia}
          />

          <UltimosMovimientos saldo={cuenta.saldo} cantidad={4} />

          <BalanceMensual balance={BALANCE_MENSUAL_DE_MUESTRA} onElegir={mostrarAviso} />
        </Stack>
      )}

      {cuenta && <ModalesDeDinero operaciones={operaciones} saldoDisponible={cuenta.saldo} />}

      <AvisoProximamente open={avisoAbierto} onClose={() => setAvisoAbierto(false)} />
    </Box>
  )
}
