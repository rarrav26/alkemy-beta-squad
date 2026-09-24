import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'

import SaldoAnimado from '../Cuentas/SaldoAnimado'
import Atajo from './Atajo'

// La tarjeta principal del Inicio mobile: saldo de la cuenta en pesos y las tres acciones más
// usadas. No abre los modales por su cuenta: avisa con los callbacks y quien la usa decide.
export default function TarjetaDeSaldo({ saldo, onAgregar, onTransferir, onVerAliasYCvu }) {
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

        <SaldoAnimado valor={saldo} />

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
