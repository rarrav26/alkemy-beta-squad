import { useEffect, useRef, useState } from 'react'

import { useAuth } from '../context/authContext'
import {
  construirConsulta,
  filtrosIniciales,
  normalizarRespuestaMovimientos
} from '../routes/movimientosUtils'

// Los últimos movimientos de la cuenta, para las listas cortas del Inicio, Cuentas y Tarjetas.
//
// Recarga cuando cambia el saldo: cada movimiento nuevo cambia el saldo, sea un depósito o una
// transferencia propios o dinero que entra en tiempo real (useMiCuenta ya refresca el saldo en
// ese caso). Así la lista se actualiza al instante, sin consultar a la API cada tantos segundos.
//
// `busqueda` es opcional y funciona como el buscador del historial: filtra por nombre de tipo
// (por ejemplo "tarjeta" trae solo los pagos con tarjeta). Sin ella, trae todos.
export default function useUltimosMovimientos({ cantidad, saldo, busqueda = '' }) {
  const { obtenerMovimientos } = useAuth()
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const huboCargaExitosa = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    async function pedirUltimosMovimientos() {
      try {
        // construirConsulta deja afuera los filtros vacíos: sin búsqueda, no viaja el parámetro.
        const consulta = construirConsulta({ ...filtrosIniciales, busqueda }, 1, cantidad)
        const respuesta = await obtenerMovimientos(consulta, controller.signal)
        if (controller.signal.aborted) return

        setMovimientos(normalizarRespuestaMovimientos(respuesta).items)
        setError('')
        huboCargaExitosa.current = true
      } catch (err) {
        if (controller.signal.aborted) return

        // Si la lista ya se mostró bien una vez, un refresco fallido la deja como está: es
        // preferible ver los movimientos de hace un momento a cambiarlos por un error.
        if (!huboCargaExitosa.current) {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false)
        }
      }
    }

    pedirUltimosMovimientos()

    return () => controller.abort()
  }, [obtenerMovimientos, cantidad, saldo, busqueda])

  return { movimientos, cargando, error }
}
