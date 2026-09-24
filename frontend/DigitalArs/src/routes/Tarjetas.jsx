import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import PagarConTarjetaModal from '../components/Cuentas/PagarConTarjetaModal'
import RevelarCodigoModal from '../components/Cuentas/RevelarCodigoModal'
import TarjetaVisual from '../components/Cuentas/TarjetaVisual'
import AccionesDeTarjeta from '../components/Tarjetas/AccionesDeTarjeta'
import TarjetaVacia from '../components/Tarjetas/TarjetaVacia'
import useMiCuenta from '../hooks/useMiCuenta'
import useMiTarjeta from '../hooks/useMiTarjeta'

// La tarjeta a la vista, con sus pistas y avisos de estado.
function TarjetaActiva({ tarjetaDelUsuario, puedePagar }) {
  const { tarjeta, secreto } = tarjetaDelUsuario

  return (
    <Stack spacing={2} sx={{ alignItems: 'center' }}>
      <TarjetaVisual
        tarjeta={tarjeta}
        secreto={secreto}
        girada={tarjetaDelUsuario.girada}
        onGirar={tarjetaDelUsuario.girar}
      />

      {/* Pista de que la tarjeta se puede girar: un elemento accionable que no se ve como un
          botón necesita decirlo, o nadie descubre el gesto. */}
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {tarjetaDelUsuario.girada ? 'Tocá la tarjeta para volver al frente.' : 'Tocá la tarjeta para ver el dorso.'}
      </Typography>

      {/* aria-live para que un lector de pantalla anuncie la cuenta regresiva: quien no ve la
          tarjeta necesita saber que los datos están a la vista y por cuánto. */}
      {secreto && (
        <Typography variant="caption" aria-live="polite" sx={{ color: 'text.secondary' }}>
          Los datos se ocultan en {tarjetaDelUsuario.segundosRestantes}s
        </Typography>
      )}

      {tarjetaDelUsuario.errorDeAccion && (
        <Alert severity="error" onClose={tarjetaDelUsuario.limpiarErrorDeAccion} sx={{ width: '100%' }}>
          {tarjetaDelUsuario.errorDeAccion}
        </Alert>
      )}

      <AccionesDeTarjeta tarjetaDelUsuario={tarjetaDelUsuario} puedePagar={puedePagar} />

      {tarjeta.estado === 'CONGELADA' && (
        <Alert severity="info" sx={{ width: '100%' }}>
          Tu tarjeta está congelada: no permite pagar ni mostrar el código de seguridad. Podés
          descongelarla cuando quieras.
        </Alert>
      )}

      {tarjeta.estaVencida && (
        <Alert severity="warning" sx={{ width: '100%' }}>
          Tu tarjeta está vencida. Dala de baja y generá una nueva.
        </Alert>
      )}
    </Stack>
  )
}

// Qué se ve según el estado de la carga. Returns tempranos en vez de condiciones anidadas.
function ContenidoDeTarjetas({ tarjetaDelUsuario, puedePagar }) {
  if (tarjetaDelUsuario.cargando) {
    return <Typography role="status">Cargando tu tarjeta…</Typography>
  }

  if (tarjetaDelUsuario.error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={tarjetaDelUsuario.reintentar}>
            Reintentar
          </Button>
        }
      >
        {tarjetaDelUsuario.error}
      </Alert>
    )
  }

  // Todavía no generó ninguna, o acaba de dar de baja la que tenía.
  if (!tarjetaDelUsuario.tarjeta) {
    return (
      <TarjetaVacia
        onGenerar={tarjetaDelUsuario.generar}
        generando={tarjetaDelUsuario.accionEnCurso}
        error={tarjetaDelUsuario.errorDeAccion}
        onCerrarError={tarjetaDelUsuario.limpiarErrorDeAccion}
      />
    )
  }

  return <TarjetaActiva tarjetaDelUsuario={tarjetaDelUsuario} puedePagar={puedePagar} />
}

// Pantalla "Tus tarjetas" del usuario regular. En el MVP hay una sola tarjeta virtual por
// cuenta. Todo el comportamiento viene de useMiTarjeta, el mismo que usa el Dashboard de
// escritorio: acá solo se decide cómo se ve en mobile.
export default function TarjetasPage() {
  // El saldo hace falta para el modal de pago, que avisa si no alcanza. La ruta ya es solo del
  // usuario regular (Protected rol={ROL_USUARIO}), así que la cuenta se pide siempre.
  const { cuenta, aplicarDeposito } = useMiCuenta({ habilitado: true })

  // Un pago devuelve el saldo ya calculado, igual que un depósito (ver useOperacionesDeDinero),
  // así que se aplica con la misma función.
  const tarjetaDelUsuario = useMiTarjeta({ onPagoRealizado: aplicarDeposito })

  // Sin la cuenta cargada no se sabe el saldo, y el modal diría que no alcanza para nada: el
  // botón aparece recién cuando la cuenta está.
  const puedePagar = tarjetaDelUsuario.puedePagar && Boolean(cuenta)

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: { xs: 2, md: 4 }, pb: 3 }}>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Tus tarjetas
      </Typography>

      <Box aria-busy={tarjetaDelUsuario.cargando}>
        <ContenidoDeTarjetas tarjetaDelUsuario={tarjetaDelUsuario} puedePagar={puedePagar} />
      </Box>

      <RevelarCodigoModal
        open={tarjetaDelUsuario.revelarAbierto}
        onClose={tarjetaDelUsuario.cerrarRevelar}
        onConfirmar={tarjetaDelUsuario.confirmarPassword}
        error={tarjetaDelUsuario.errorDePassword}
        cargando={tarjetaDelUsuario.verificando}
      />

      <PagarConTarjetaModal
        open={tarjetaDelUsuario.pagoAbierto}
        onClose={tarjetaDelUsuario.cerrarPago}
        onConfirmar={tarjetaDelUsuario.pagar}
        saldoDisponible={cuenta?.saldo ?? 0}
        comprobante={tarjetaDelUsuario.comprobante}
        error={tarjetaDelUsuario.errorDePago}
        cargando={tarjetaDelUsuario.pagando}
      />
    </Box>
  )
}
