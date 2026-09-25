import { useState } from 'react'

import { useAuth } from '../context/authContext'
import { getSessionUser } from '../routes/dashboardUtils'

const PREFIJO_DE_LA_CLAVE = 'digitalars.saldoVisible'
const VALOR_VISIBLE = 'si'

// Una clave por usuario: si otra persona inicia sesión en la misma pestaña, no hereda el saldo
// visible de quien estaba antes.
function claveDelUsuario(session) {
  const usuario = getSessionUser(session)
  return `${PREFIJO_DE_LA_CLAVE}.${usuario?.usuarioId ?? usuario?.email}`
}

// sessionStorage puede fallar (navegación privada, almacenamiento bloqueado). Si pasa, el saldo
// arranca oculto, que es lo más seguro.
function leerSaldoVisible(clave) {
  try {
    return sessionStorage.getItem(clave) === VALOR_VISIBLE
  } catch {
    return false
  }
}

// Si no se puede guardar, el ojo igual funciona: solo que no se recuerda al navegar.
function guardarSaldoVisible(clave, visible) {
  try {
    if (visible) {
      sessionStorage.setItem(clave, VALOR_VISIBLE)
      return
    }
    sessionStorage.removeItem(clave)
  } catch {
    // Nada que hacer: el estado en memoria sigue siendo el correcto.
  }
}

// Mostrar u ocultar el saldo. La primera vez arranca oculto a propósito: la app se abre en
// lugares públicos (el colectivo, una fila) y el monto no debería quedar a la vista de quien
// mira por encima del hombro. Si el usuario lo muestra, queda recordado en sessionStorage
// hasta que cierre la pestaña: al volver al Inicio lo encuentra como lo dejó.
export default function useSaldoVisible() {
  const { session } = useAuth()
  const clave = claveDelUsuario(session)
  const [saldoVisible, setSaldoVisible] = useState(() => leerSaldoVisible(clave))

  function alternarVisibilidad() {
    const nuevoValor = !saldoVisible
    setSaldoVisible(nuevoValor)
    guardarSaldoVisible(clave, nuevoValor)
  }

  return { saldoVisible, alternarVisibilidad }
}
