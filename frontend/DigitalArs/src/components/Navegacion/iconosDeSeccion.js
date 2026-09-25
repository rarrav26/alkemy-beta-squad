import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded'
import CreditCardRounded from '@mui/icons-material/CreditCardRounded'
import GroupRounded from '@mui/icons-material/GroupRounded'
import HomeRounded from '@mui/icons-material/HomeRounded'
import PersonAddRounded from '@mui/icons-material/PersonAddRounded'
import PersonRounded from '@mui/icons-material/PersonRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'

import {
  SECCION_CUENTAS,
  SECCION_INICIO,
  SECCION_MOVIMIENTOS,
  SECCION_NUEVO_USUARIO,
  SECCION_PERFIL,
  SECCION_TARJETAS,
  SECCION_USUARIOS
} from '../../routes/navegacionUtils'

// El ícono de cada sección, compartido por las TRES navegaciones: la barra inferior de mobile,
// el menú "Más" y la barra lateral de escritorio.
//
// Está en un archivo propio y no en navegacionUtils porque ahí no hay JSX, y no repetido en cada
// barra porque si el ícono de Tarjetas cambiara solo en una, la misma sección se vería distinta
// según el ancho de la pantalla — o peor, según si se entró por la barra o por el menú.
//
// Todos son de la familia Rounded, que es la decisión de estilo del proyecto: no mezclar.
export const ICONO_POR_SECCION = {
  [SECCION_INICIO]: HomeRounded,
  [SECCION_CUENTAS]: AccountBalanceRounded,
  [SECCION_TARJETAS]: CreditCardRounded,
  [SECCION_MOVIMIENTOS]: ReceiptLongRounded,
  [SECCION_PERFIL]: PersonRounded,
  [SECCION_USUARIOS]: GroupRounded,
  [SECCION_NUEVO_USUARIO]: PersonAddRounded
}
