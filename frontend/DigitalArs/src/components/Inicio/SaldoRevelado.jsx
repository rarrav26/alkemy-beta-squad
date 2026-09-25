import { useEffect, useState } from 'react'

import SaldoAnimado from '../Cuentas/SaldoAnimado'

// Pausa antes de mover el número, para que la animación se note: al revelar el saldo o al
// entrar al Inicio, la tarjeta termina de aparecer antes de que el número empiece a subir; y
// después de un depósito o una transferencia, el modal ya se cerró cuando el saldo cambia.
const RETRASO_DE_LA_ANIMACION_EN_MS = 300

// El saldo de la tarjeta del Inicio cuando está visible. Solo existe mientras el ojo está
// abierto: cada vez que aparece (al tocar el ojo o al volver al Inicio con el saldo visible)
// arranca en 0 y sube hasta el saldo real. Después, cada cambio de saldo se anima desde el
// valor anterior al nuevo, con la misma pausa.
//
// El número lo anima SaldoAnimado (NumberFlow): quien prefiere sin animaciones lo ve cambiar
// de una, igual que en el resto de la app.
export default function SaldoRevelado({ saldo }) {
  const [valorMostrado, setValorMostrado] = useState(0)

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setValorMostrado(saldo)
    }, RETRASO_DE_LA_ANIMACION_EN_MS)

    // Si el saldo vuelve a cambiar durante la pausa, se descarta el cambio viejo y gana el
    // último: la tarjeta nunca termina mostrando un saldo que ya no es el actual.
    return () => window.clearTimeout(temporizador)
  }, [saldo])

  return <SaldoAnimado valor={valorMostrado} />
}
