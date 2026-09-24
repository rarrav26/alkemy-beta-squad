import PhoneIphoneRounded from '@mui/icons-material/PhoneIphoneRounded'
import ReceiptRounded from '@mui/icons-material/ReceiptRounded'
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded'
import SavingsRounded from '@mui/icons-material/SavingsRounded'

// ÚNICO lugar con datos inventados del Inicio mobile. Todo lo de acá es de muestra: la API no
// tiene nada de esto todavía, y en pantalla se marca como "Próximamente". Cuando una de estas
// funciones exista de verdad, se borra de este archivo y se conecta a la API; si algo falso
// aparece en un componente fuera de acá, es un error.

export const ATAJOS_DE_MUESTRA = [
  { id: 'frascos', etiqueta: 'Frascos', Icono: SavingsRounded, insignia: '20%' },
  { id: 'recargas', etiqueta: 'Recargas', Icono: PhoneIphoneRounded },
  { id: 'servicios', etiqueta: 'Servicios', Icono: ReceiptRounded },
  { id: 'prestamos', etiqueta: 'Préstamos', Icono: RequestQuoteRounded }
]
