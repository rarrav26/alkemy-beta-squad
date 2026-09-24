import { useState } from 'react'

import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded'
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'

import useSaldoVisible from '../../hooks/useSaldoVisible'
import AliasYCvuDialog from '../Cuentas/AliasYCvuDialog'
import Atajo from './Atajo'
import SaldoRevelado from './SaldoRevelado'

// Mismo tamaño y peso que SaldoAnimado, así la tarjeta no salta de alto al alternar. Para el
// lector de pantalla "Shh..." no dice nada: se anuncia como "Saldo oculto".
function SaldoOculto() {
  return (
    <Typography variant="h4" component="div" role="img" aria-label="Saldo oculto" sx={{ fontWeight: 700 }}>
      Shh...
    </Typography>
  )
}

// La tarjeta de la cuenta en pesos, con el saldo y las tres acciones más usadas. La usan el
// Inicio mobile y la pantalla Cuentas.
//
// Depositar y transferir cambian el saldo, así que esos modales los maneja quien usa la tarjeta
// (se avisa con onAgregar y onTransferir). "Alias y CVU" solo muestra datos: ese diálogo vive
// acá adentro, así ninguna pantalla tiene que repetirlo.
// La etiqueta de variación es opcional: sin ella, el chip no se dibuja.
export default function TarjetaDeSaldo({ cuenta, etiquetaDeVariacion, onAgregar, onTransferir }) {
  const { saldoVisible, alternarVisibilidad } = useSaldoVisible()
  const [aliasYCvuAbierto, setAliasYCvuAbierto] = useState(false)

  const acciones = [
    { etiqueta: 'Agregar', Icono: AddRounded, onClick: onAgregar },
    { etiqueta: 'Transferir', Icono: SwapHorizRounded, onClick: onTransferir },
    { etiqueta: 'Alias y CVU', Icono: BadgeRounded, onClick: () => setAliasYCvuAbierto(true) }
  ]

  return (
    <>
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

          <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Saldo disponible
            </Typography>

            {etiquetaDeVariacion && (
              <Chip
                size="small"
                color="success"
                variant="outlined"
                icon={<TrendingUpRounded aria-hidden="true" />}
                label={etiquetaDeVariacion}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {saldoVisible ? <SaldoRevelado saldo={cuenta.saldo} /> : <SaldoOculto />}

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

      <AliasYCvuDialog
        open={aliasYCvuAbierto}
        onClose={() => setAliasYCvuAbierto(false)}
        alias={cuenta.alias}
        cvu={cuenta.cvu}
      />
    </>
  )
}
