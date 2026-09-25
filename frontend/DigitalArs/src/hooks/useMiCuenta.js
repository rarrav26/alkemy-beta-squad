import { useEffect, useState } from 'react'

import { useAuth } from '../context/authContext'
import { useNotificaciones } from '../context/notificacionesContext'

// Algunos errores llegan con la misma frase repetida (el mensaje del servidor más el de la
// capa HTTP). Se dejan las frases una sola vez para no mostrarle al usuario un texto duplicado.
function normalizarMensajeDeError(error) {
  const mensajeCrudo = (error.message || '').trim()
  const frases = mensajeCrudo
    .split('.')
    .map(frase => frase.trim())
    .filter(Boolean)
  const frasesUnicas = [...new Set(frases)]

  if (frasesUnicas.length === 0) return mensajeCrudo
  return `${frasesUnicas.join('. ')}.`
}

// La cuenta del usuario logueado: carga inicial, reintento, refresco cuando entra dinero y
// actualización del saldo después de un depósito o una transferencia. Vive en un hook y no en
// Dashboard para que la vista de escritorio y la de mobile lean exactamente los mismos datos.
//
// Recibe `habilitado` porque un hook no se puede llamar de forma condicional: el Dashboard
// también lo renderiza el administrador, que no tiene billetera y al que la API le responde 403.
export default function useMiCuenta({ habilitado }) {
  const { obtenerMiCuenta } = useAuth()
  const { avisosRecibidos } = useNotificaciones()
  const [cuenta, setCuenta] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!habilitado) return

    const controller = new AbortController()

    async function cargarCuenta() {
      setCargando(true)
      setError('')
      setCuenta(null)

      try {
        const datos = await obtenerMiCuenta(controller.signal)

        if (!controller.signal.aborted) {
          setCuenta(datos)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(normalizarMensajeDeError(error))
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false)
        }
      }
    }

    cargarCuenta()

    return () => controller.abort()
  }, [obtenerMiCuenta, habilitado, intento])

  // Cuando entra dinero, el mensaje del socket trae la notificación, no el saldo: hay que volver
  // a pedirlo. Va en un efecto aparte y NO reusa el contador "intento" de arriba, porque ese
  // efecto pone la cuenta en null y la tarjeta mostraría "Cargando tu cuenta…" cada vez que
  // llega una transferencia. Acá el saldo se cambia sin que se note el reemplazo.
  useEffect(() => {
    if (!habilitado || avisosRecibidos === 0) return

    const controller = new AbortController()

    obtenerMiCuenta(controller.signal)
      .then(datos => {
        if (!controller.signal.aborted) setCuenta(datos)
      })
      // Si el refresco de fondo falla, se deja el saldo anterior en pantalla: es preferible a
      // romper la tarjeta por algo que el usuario no pidió.
      .catch(() => {})

    return () => controller.abort()
  }, [avisosRecibidos, habilitado, obtenerMiCuenta])

  function reintentar() {
    setIntento(valor => valor + 1)
  }

  function aplicarDeposito(resultado) {
    setCuenta(actual => {
      if (!actual) return actual
      return { ...actual, saldo: resultado.saldoActual }
    })
  }

  // Si la respuesta no trae el saldo final, se descuenta el importe a mano para que la tarjeta
  // no quede mostrando un saldo que ya no existe.
  function aplicarTransferencia(resultado) {
    setCuenta(actual => {
      if (!actual) return actual
      if (resultado?.saldoActual !== undefined) {
        return { ...actual, saldo: resultado.saldoActual }
      }
      return { ...actual, saldo: actual.saldo - (resultado?.importe || 0) }
    })
  }

  return { cuenta, cargando, error, reintentar, aplicarDeposito, aplicarTransferencia }
}
