// Los títulos tienen que decir exactamente lo mismo que MensajesDeNotificacion en el backend.
// Es el mismo criterio que ya usa rolesUtils.js con los nombres de los roles: un valor que llega
// del servidor como texto plano se repite acá como constante, no se escribe suelto en cada lugar
// donde hace falta.
const TITULO_INGRESO_DE_DINERO = 'Ingreso de dinero'
const TITULO_TRANSFERENCIA_RECIBIDA = 'Transferencia recibida'
const TITULO_PAGO_RECIBIDO = 'Pago recibido'

// Los avisos que nacen de algo que hizo OTRA persona: te mandaron plata. Todos los demás (un
// depósito, una transferencia enviada, un pago con tarjeta, congelar la tarjeta...) son
// respuesta a algo que hizo el mismo usuario, y su pantalla ya se lo confirmó.
const TITULOS_DE_AVISOS_DE_OTRA_PERSONA = [TITULO_TRANSFERENCIA_RECIBIDA, TITULO_PAGO_RECIBIDO]

// Un ingreso de dinero se muestra en verde, el mismo color de éxito que ya usa el resto de la
// app para un crédito (Movimientos.jsx pinta igual sus filas de depósito).
//
// La regla vive acá y no en cada componente porque la preguntan DOS lugares distintos: la fila
// del panel y el cartel que aparece cuando el aviso llega en el momento. Si estuviera escrita en
// los dos, alcanzaría con tocar uno solo para que dejaran de coincidir.
export function esIngresoDeDinero(notificacion) {
  return notificacion?.titulo === TITULO_INGRESO_DE_DINERO
}

// Si el aviso merece el cartel flotante. Solo lo que llega de otra persona: para una operación
// propia, el cartel repetía lo que la pantalla ya había confirmado ("Transferencia realizada
// con éxito" y encima "Enviaste $ …"). Esos avisos igual quedan en la campana.
export function llegoDeOtraPersona(notificacion) {
  return TITULOS_DE_AVISOS_DE_OTRA_PERSONA.includes(notificacion?.titulo)
}
