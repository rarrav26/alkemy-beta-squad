import { keyframes } from '@mui/system'

// Las transiciones de la app, en un solo lugar. Definidas acá y no en cada componente para que
// todo se mueva con la MISMA curva y duración: cuando cada pantalla elige la suya, la app se
// siente hecha de pedazos aunque cada pedazo esté bien.
//
// Sin dependencias nuevas: son keyframes de CSS. Los componentes de animación de react-bits
// necesitan GSAP + ScrollTrigger, que es mucho peso para una aparición que el navegador ya sabe
// hacer, y además no pasan por el tema ni por prefers-reduced-motion sin cablearlo a mano.

// Corta pero no instantánea. Más de ~350ms en una transición de pantalla se siente lenta cuando
// el usuario ya sabe a dónde va.
export const DURACION_DE_APARICION = 320

// Arranca rápido y frena suave (sin "rebote"): es la curva de salida estándar de Material, y la
// misma familia que ya usa el giro de la tarjeta.
export const CURVA_DE_SALIDA = 'cubic-bezier(0.2, 0, 0, 1)'

// El desplazamiento es chico a propósito. Un recorrido largo llama la atención sobre la animación
// en lugar del contenido, y en una lista escalonada se vuelve marea.
export const DESPLAZAMIENTO_DE_APARICION = 10

// Un pelín más chico al empezar, para que el elemento se sienta "acercándose" y no solo subiendo.
// 0.98 y no menos: por debajo de ~0.95 el borde de una tarjeta se ve blando mientras escala, y
// pasa de vistoso a llamativo.
export const ESCALA_DE_APARICION = 0.98

// Termina en `transform: none` y NO en `translateY(0) scale(1)`, que se vería igual. El motivo es
// técnico: un transform vigente convierte al elemento en el marco de referencia de sus
// descendientes `position: fixed`, y como la animación usa `both` el último fotograma queda
// aplicado para siempre. Con `none` el marco desaparece al terminar.
export const aparecerDesdeAbajo = keyframes`
  from {
    opacity: 0;
    transform: translateY(${DESPLAZAMIENTO_DE_APARICION}px) scale(${ESCALA_DE_APARICION});
  }
  to {
    opacity: 1;
    transform: none;
  }
`

// Quien pidió menos movimiento ve el contenido puesto, sin recorrido. No es un detalle de gusto:
// el movimiento puede provocar mareo y malestar real a quien tiene trastornos vestibulares, y es
// el mismo criterio que ya siguen el giro de la tarjeta y el saldo animado.
//
// Repone `opacity: 1` además de apagar la animación, y eso es lo importante: la aparición
// escondía el elemento ANTES de animarlo, así que apagar solo la animación lo dejaría invisible
// para siempre. Una animación de más es un detalle; contenido que no se ve es una pantalla rota.
export const SIN_MOVIMIENTO = {
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    opacity: 1,
    transform: 'none'
  }
}

// El sx completo de una aparición, listo para pasar a cualquier componente.
export function apariciones({ retardo = 0 } = {}) {
  return {
    // `both` hace que el elemento arranque invisible ANTES de que la animación empiece: sin eso,
    // con retardo se vería un instante en su lugar final y recién después saltaría al principio.
    animation: `${aparecerDesdeAbajo} ${DURACION_DE_APARICION}ms ${CURVA_DE_SALIDA} ${retardo}ms both`,
    ...SIN_MOVIMIENTO
  }
}

// Cómo se ve un elemento que todavía no le toca aparecer: escondido y ya corrido, así el primer
// fotograma de la animación no salta. Lleva el mismo escape de prefers-reduced-motion, porque
// quien pidió menos movimiento tiene que ver el contenido igual.
export const ANTES_DE_APARECER = {
  opacity: 0,
  transform: `translateY(${DESPLAZAMIENTO_DE_APARICION}px) scale(${ESCALA_DE_APARICION})`,
  ...SIN_MOVIMIENTO
}
