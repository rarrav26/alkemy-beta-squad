import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded'
import DescriptionRounded from '@mui/icons-material/DescriptionRounded'
import EuroRounded from '@mui/icons-material/EuroRounded'
import LinkRounded from '@mui/icons-material/LinkRounded'
import PhoneIphoneRounded from '@mui/icons-material/PhoneIphoneRounded'
import ReceiptRounded from '@mui/icons-material/ReceiptRounded'
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded'
import SavingsRounded from '@mui/icons-material/SavingsRounded'
import SpeedRounded from '@mui/icons-material/SpeedRounded'

// ÚNICO lugar con datos inventados de toda la app (Inicio, Cuentas...). Todo lo de acá es de
// muestra: la API no tiene nada de esto todavía, y en pantalla se marca como "Próximamente".
// Cuando una de estas
// funciones exista de verdad, se borra de este archivo y se conecta a la API; si algo falso
// aparece en un componente fuera de acá, es un error.
//
// El diseño toma como referencia otra billetera, pero acá no va NINGÚN nombre de producto,
// eslogan ni marca de esa app: los productos de muestra llevan nombres genéricos propios.

// Variación del saldo que muestra la tarjeta. El "Próximamente" va pegado al número: el saldo
// de al lado es real y este porcentaje no, así que no pueden leerse como un mismo dato.
export const ETIQUETA_DE_VARIACION_DE_MUESTRA = '+19% · Próximamente'

// Sin saldo a propósito: un monto inventado al lado de la cuenta real en pesos podría leerse
// como plata que el usuario tiene.
export const CUENTAS_DE_MUESTRA = [
  { id: 'usd', nombre: 'Cuenta en dólares', descripcion: 'Comprá y ahorrá en dólares.', Icono: AttachMoneyRounded },
  { id: 'eur', nombre: 'Cuenta en euros', descripcion: 'Guardá euros para tu próximo viaje.', Icono: EuroRounded }
]

export const PROMO_DE_CREDITO_DE_MUESTRA = {
  titulo: 'Tu primera tarjeta de crédito',
  descripcion: 'Pedila desde la app, sin costo de emisión.',
  accion: 'Quiero la mía'
}

export const BANNER_DE_MUESTRA = {
  titulo: 'Invitá a tus amigos',
  descripcion: 'Cuando se sumen a DigitalArs, los dos reciben un beneficio.'
}

export const ATAJOS_DE_MUESTRA = [
  { id: 'plazo-fijo', etiqueta: 'Plazo fijo', Icono: SavingsRounded, insignia: 'Nuevo' },
  { id: 'recargas', etiqueta: 'Recargas', Icono: PhoneIphoneRounded },
  { id: 'servicios', etiqueta: 'Servicios', Icono: ReceiptRounded },
  { id: 'prestamos', etiqueta: 'Préstamos', Icono: RequestQuoteRounded }
]

// Balance del mes de la pantalla Cuentas. Son montos inventados: la tarjeta que los muestra
// lleva el chip "Próximamente" y su dona se anuncia como "datos de muestra".
export const BALANCE_MENSUAL_DE_MUESTRA = {
  ingresos: 185000,
  gastos: 128500
}

// Opciones de "Gestioná tu cuenta" en la pantalla Cuentas. Ninguna existe todavía; no hay
// "límites en dólares" porque el MVP no tiene cuenta en USD.
export const OPCIONES_DE_GESTION_DE_MUESTRA = [
  {
    id: 'retirar',
    titulo: 'Retirar dinero',
    descripcion: 'Pasá tu saldo a una cuenta bancaria.',
    Icono: AccountBalanceWalletRounded
  },
  {
    id: 'documentos',
    titulo: 'Documentos de la cuenta',
    descripcion: 'Descargá resúmenes y comprobantes de tus movimientos.',
    Icono: DescriptionRounded
  },
  {
    id: 'limites',
    titulo: 'Límites de la cuenta',
    descripcion: 'Mirá cuánto podés ingresar y transferir.',
    Icono: SpeedRounded
  },
  {
    id: 'vinculadas',
    titulo: 'Cuentas vinculadas',
    descripcion: 'Conectá otras cuentas para ingresar dinero más rápido.',
    Icono: LinkRounded
  }
]
