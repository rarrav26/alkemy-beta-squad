import Box from '@mui/material/Box'
import AcUnitRounded from '@mui/icons-material/AcUnitRounded'
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded'
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
import WbSunnyRounded from '@mui/icons-material/WbSunnyRounded'

import Atajo from '../Inicio/Atajo'

// Qué acciones se ofrecen según el estado de la tarjeta. Cada permiso lo decide el backend
// (puedeCongelarse, puedeRevelarseElCodigo...): el front no deduce la máquina de estados por
// su cuenta. "Dar de baja" no va acá: es irreversible y vive aparte, en "Gestioná tu tarjeta".
function accionesDisponibles({ tarjetaDelUsuario, puedePagar }) {
  const { tarjeta, secreto } = tarjetaDelUsuario
  const acciones = []

  if (puedePagar) {
    acciones.push({ etiqueta: 'Pagar', Icono: ShoppingCartRounded, onClick: tarjetaDelUsuario.abrirPago })
  }

  if (secreto) {
    acciones.push({ etiqueta: 'Ocultar datos', Icono: VisibilityOffRounded, onClick: tarjetaDelUsuario.ocultarSecreto })
  }

  if (!secreto && tarjeta.puedeRevelarseElCodigo) {
    acciones.push({ etiqueta: 'Ver datos', Icono: VisibilityRounded, onClick: tarjetaDelUsuario.abrirRevelar })
  }

  if (tarjeta.puedeCongelarse) {
    acciones.push({ etiqueta: 'Congelar', Icono: AcUnitRounded, onClick: tarjetaDelUsuario.congelar })
  }

  if (tarjeta.puedeDescongelarse) {
    acciones.push({ etiqueta: 'Descongelar', Icono: WbSunnyRounded, onClick: tarjetaDelUsuario.descongelar })
  }

  return acciones
}

// Las acciones de la tarjeta en círculos, igual que Agregar / Transferir en la tarjeta de
// saldo. Se muestran solo las que el estado permite, así que puede haber de una a tres: la
// grilla toma tantas columnas como acciones haya, para que queden centradas.
export default function AccionesDeTarjeta({ tarjetaDelUsuario, puedePagar }) {
  const acciones = accionesDisponibles({ tarjetaDelUsuario, puedePagar })

  if (acciones.length === 0) return null

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${acciones.length}, 1fr)`,
        gap: 1,
        width: '100%',
        maxWidth: 360
      }}
    >
      {acciones.map(accion => (
        <Atajo
          key={accion.etiqueta}
          etiqueta={accion.etiqueta}
          Icono={accion.Icono}
          onClick={accion.onClick}
          disabled={tarjetaDelUsuario.accionEnCurso}
        />
      ))}
    </Box>
  )
}
