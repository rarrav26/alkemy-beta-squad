import { useState } from 'react'

// Mostrar u ocultar el saldo. Arranca oculto a propósito: la app se abre en lugares públicos
// (el colectivo, una fila) y el monto no debería quedar a la vista de quien mira por encima
// del hombro. Tampoco se guarda: cada vez que se vuelve al Inicio, arranca oculto de nuevo.
export default function useSaldoVisible() {
  const [saldoVisible, setSaldoVisible] = useState(false)

  function alternarVisibilidad() {
    setSaldoVisible(visibleAntes => !visibleAntes)
  }

  return { saldoVisible, alternarVisibilidad }
}
