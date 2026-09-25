import { useState } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { rangoDeFechasValido } from '../../routes/movimientosUtils'
import TiradorDeHoja from '../Navegacion/TiradorDeHoja'

// color-scheme hace que el navegador dibuje el ícono y el almanaque del input date en el
// modo del tema: sin esto, en modo noche el ícono sale negro sobre fondo negro.
function estiloDelCampoDeFecha(theme) {
  return { '& input': { colorScheme: theme.palette.mode } }
}

// Hoja que sube desde abajo con el rango de fechas del historial mobile. Las fechas que se
// editan acá no filtran nada hasta tocar "Aplicar": así el usuario puede corregir una fecha
// sin que la lista se recargue con cada cambio.
export default function HojaDeFiltrosDeFecha({ open, onClose, desde, hasta, onAplicar }) {
  const [desdeElegido, setDesdeElegido] = useState(desde)
  const [hastaElegido, setHastaElegido] = useState(hasta)

  // Cada vez que se abre, los campos arrancan con las fechas aplicadas, no con lo que quedó
  // escrito la vez anterior sin aplicar. Se hace al empezar la animación de apertura y no
  // volviendo a montar la hoja: montada ya abierta, la hoja aparece sin deslizarse.
  function reiniciarCampos() {
    setDesdeElegido(desde)
    setHastaElegido(hasta)
  }

  const rangoValido = rangoDeFechasValido(desdeElegido, hastaElegido)

  function aplicar() {
    onAplicar({ desde: desdeElegido, hasta: hastaElegido })
    onClose()
  }

  function limpiar() {
    onAplicar({ desde: '', hasta: '' })
    onClose()
  }

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        transition: { onEnter: reiniciarCampos },
        paper: {
          sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, pb: 'env(safe-area-inset-bottom)' }
        }
      }}
    >
      <TiradorDeHoja />

      <Stack spacing={2.5} sx={{ px: 2, pt: 1.5, pb: 3 }}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
          Filtrar por fecha
        </Typography>

        <TextField
          type="date"
          label="Desde"
          value={desdeElegido}
          onChange={evento => setDesdeElegido(evento.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={estiloDelCampoDeFecha}
        />

        <TextField
          type="date"
          label="Hasta"
          value={hastaElegido}
          onChange={evento => setHastaElegido(evento.target.value)}
          error={!rangoValido}
          helperText={rangoValido ? ' ' : '"Hasta" no puede ser anterior a "Desde".'}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={estiloDelCampoDeFecha}
        />

        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" fullWidth onClick={limpiar} sx={{ borderRadius: 999, py: 1.25 }}>
            Limpiar
          </Button>
          <Button
            variant="contained"
            fullWidth
            disableElevation
            onClick={aplicar}
            disabled={!rangoValido}
            sx={{ borderRadius: 999, py: 1.25, fontWeight: 700 }}
          >
            Aplicar
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  )
}
