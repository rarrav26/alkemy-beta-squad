import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'

import useSaldoVisible from '../../hooks/useSaldoVisible'
import SaldoAnimado from '../Cuentas/SaldoAnimado'
import Atajo from './Atajo'

// Mismo tamaño y peso que SaldoAnimado, así la tarjeta no salta de alto al alternar. Para el
// lector de pantalla "Shh..." no dice nada: se anuncia como "Saldo oculto".
function SaldoOculto() {
  return (
    <Typography variant="h4" component="div" role="img" aria-label="Saldo oculto" sx={{ fontWeight: 700 }}>
      Shh...
    </Typography>
  )
}

// La tarjeta principal del Inicio mobile: saldo de la cuenta en pesos y las tres acciones más
// usadas. No abre los modales por su cuenta: avisa con los callbacks y quien la usa decide.
export default function TarjetaDeSaldo({ saldo, onAgregar, onTransferir, onVerAliasYCvu }) {
  const { saldoVisible, alternarVisibilidad } = useSaldoVisible()

  const acciones = [
    { etiqueta: 'Agregar', Icono: AddRounded, onClick: onAgregar },
    { etiqueta: 'Transferir', Icono: SwapHorizRounded, onClick: onTransferir },
    { etiqueta: 'Alias y CVU', Icono: BadgeRounded, onClick: onVerAliasYCvu }
  ]

  return (
    <Card component="section" variant="outlined" aria-labelledby="titulo-tarjeta-de-saldo">
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <AccountBalanceWalletRounded fontSize="small" aria-hidden="true" />
          </Avatar>

          <Typography id="titulo-tarjeta-de-saldo" component="h2" variant="subtitle1" sx={{ fontWeight: 700 }}>
            Cuenta en pesos
          </Typography>
        </Stack>

        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
          Saldo disponible
        </Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {saldoVisible ? <SaldoAnimado valor={saldo} /> : <SaldoOculto />}

          <IconButton
            onClick={alternarVisibilidad}
            aria-label={saldoVisible ? 'Ocultar saldo' : 'Mostrar saldo'}
            sx={{ color: 'text.secondary' }}
          >
            {saldoVisible ? <VisibilityOffRounded /> : <VisibilityRounded />}
          </IconButton>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
          {acciones.map(accion => (
            <Atajo
              key={accion.etiqueta}
              etiqueta={accion.etiqueta}
              Icono={accion.Icono}
              onClick={accion.onClick}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
