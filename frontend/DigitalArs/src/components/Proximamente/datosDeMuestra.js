import AttachMoneyRounded from '@mui/icons-material/AttachMoneyRounded'
import EuroRounded from '@mui/icons-material/EuroRounded'
import PhoneIphoneRounded from '@mui/icons-material/PhoneIphoneRounded'
import ReceiptRounded from '@mui/icons-material/ReceiptRounded'
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded'
import SavingsRounded from '@mui/icons-material/SavingsRounded'

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
