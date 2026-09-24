// Tiene que decir exactamente lo mismo que MensajesDeNotificacion.TituloDeposito en el backend.
// Es el mismo criterio que ya usa rolesUtils.js con los nombres de los roles: un valor que llega
// del servidor como texto plano se repite acá como constante, no se escribe suelto en cada lugar
// donde hace falta.
const TITULO_INGRESO_DE_DINERO = 'Ingreso de dinero'

// Un ingreso de dinero se muestra en verde, el mismo color de éxito que ya usa el resto de la
// app para un crédito (Movimientos.jsx pinta igual sus filas de depósito).
//
// La regla vive acá y no en cada componente porque la preguntan DOS lugares distintos: la fila
// del panel y el cartel que aparece cuando el aviso llega en el momento. Si estuviera escrita en
// los dos, alcanzaría con tocar uno solo para que dejaran de coincidir.
export function esIngresoDeDinero(notificacion) {
  return notificacion?.titulo === TITULO_INGRESO_DE_DINERO
}
