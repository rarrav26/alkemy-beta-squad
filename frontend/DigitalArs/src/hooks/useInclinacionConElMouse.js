import { useCallback, useEffect, useRef } from 'react'

// Cuánto se inclina la tarjeta en los bordes, en grados. Ocho alcanza para que se sienta un
// objeto con volumen; más arriba de ~12 deja de parecer una tarjeta y parece una puerta girando.
const GRADOS_MAXIMOS = 8

// Nombres de las variables CSS que escribe el hook. Están acá para que el componente las lea del
// mismo lugar y no puedan escribirse distinto en los dos archivos.
export const VARIABLE_INCLINACION_X = '--inclinacion-x'
export const VARIABLE_INCLINACION_Y = '--inclinacion-y'
export const VARIABLE_BRILLO_X = '--brillo-x'
export const VARIABLE_BRILLO_Y = '--brillo-y'

// Sigue al puntero sobre un elemento y publica su posición como variables CSS: dos de rotación
// para inclinar en 3D, y dos de posición para que un brillo lo persiga.
//
// Escribe las variables DIRECTAMENTE en el nodo, sin pasar por estado de React. Con estado, cada
// movimiento del mouse dispararía un render del árbol entero de la tarjeta — sesenta por segundo
// mientras el usuario la recorre. Así el navegador solo recalcula estilo, que es lo único que
// cambió.
//
// Se activa SOLO donde tiene sentido:
//   - `hover: hover` deja afuera las pantallas táctiles, donde no hay puntero que seguir y el
//     gesto real es tocar para girar.
//   - `prefers-reduced-motion` lo apaga para quien pidió menos movimiento; la tarjeta queda
//     quieta y se sigue pudiendo girar y revelar, que es lo que importa.
// Las dos se consultan en cada movimiento y no una sola vez, así cambiar la preferencia del
// sistema operativo surte efecto sin recargar la página.
export default function useInclinacionConElMouse({ gradosMaximos = GRADOS_MAXIMOS } = {}) {
  const referencia = useRef(null)
  const consultas = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    consultas.current = {
      tienePuntero: window.matchMedia('(hover: hover)'),
      quiereMenosMovimiento: window.matchMedia('(prefers-reduced-motion: reduce)')
    }
  }, [])

  const puedeInclinarse = useCallback(() => {
    const actuales = consultas.current
    if (!actuales) return false

    return actuales.tienePuntero.matches && !actuales.quiereMenosMovimiento.matches
  }, [])

  const volverAlReposo = useCallback(() => {
    const nodo = referencia.current
    if (!nodo) return

    nodo.style.setProperty(VARIABLE_INCLINACION_X, '0deg')
    nodo.style.setProperty(VARIABLE_INCLINACION_Y, '0deg')
  }, [])

  const alMoverElPuntero = useCallback(
    evento => {
      const nodo = referencia.current
      if (!nodo || !puedeInclinarse()) return

      const caja = nodo.getBoundingClientRect()
      if (caja.width === 0 || caja.height === 0) return

      // Posición del puntero dentro del elemento, de 0 a 1.
      const proporcionX = (evento.clientX - caja.left) / caja.width
      const proporcionY = (evento.clientY - caja.top) / caja.height

      // Centrada en 0: -0.5 en un borde, +0.5 en el otro.
      const desdeElCentroX = proporcionX - 0.5
      const desdeElCentroY = proporcionY - 0.5

      // La rotación en X va con el signo invertido: mover el puntero hacia ABAJO tiene que
      // hundir el borde de abajo, y rotateX positivo lo levantaría. Sin esto la tarjeta se
      // siente al revés, como empujada desde el lado contrario.
      nodo.style.setProperty(VARIABLE_INCLINACION_X, `${-desdeElCentroY * 2 * gradosMaximos}deg`)
      nodo.style.setProperty(VARIABLE_INCLINACION_Y, `${desdeElCentroX * 2 * gradosMaximos}deg`)

      nodo.style.setProperty(VARIABLE_BRILLO_X, `${proporcionX * 100}%`)
      nodo.style.setProperty(VARIABLE_BRILLO_Y, `${proporcionY * 100}%`)
    },
    [gradosMaximos, puedeInclinarse]
  )

  // Eventos de puntero y no de mouse: cubren también lápiz y trackpad con un solo par, y en una
  // pantalla táctil no hacen nada porque la consulta `hover` los descarta.
  const manejadores = {
    onPointerMove: alMoverElPuntero,
    onPointerLeave: volverAlReposo,
    // Un puntero puede irse sin que se dispare `leave` (por ejemplo si el navegador lo captura
    // durante un arrastre); esto evita que la tarjeta quede torcida.
    onPointerCancel: volverAlReposo,
    onBlur: volverAlReposo
  }

  return { referencia, manejadores }
}
