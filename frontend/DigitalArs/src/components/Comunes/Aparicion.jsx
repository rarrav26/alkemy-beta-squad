import { useEffect, useRef, useState } from 'react'

import Box from '@mui/material/Box'

import { ANTES_DE_APARECER, apariciones } from './transiciones'

// Espacio entre una aparición y la siguiente cuando varias entran en fila. 60ms es poco a
// propósito: se percibe como "la pantalla se arma" y no como elementos llegando de a uno, que con
// seis secciones haría esperar casi un segundo hasta ver la última.
const PASO_DEL_ESCALONADO = 60

// Cuántas se escalonan antes de que todas entren juntas. Sin tope, una lista larga deja lo último
// fuera de pantalla llegando tarde, y el usuario ya scrolleó hasta ahí.
const MAXIMO_ESCALONADO = 6

// Cuánto del elemento tiene que entrar en pantalla para que aparezca. Un 10% alcanza: con más, una
// sección alta recién se animaría cuando ya la estás leyendo.
const PARTE_VISIBLE_NECESARIA = 0.1

// Se adelanta un poco al borde de la pantalla, así el elemento termina de aparecer justo cuando
// llega a la vista en lugar de empezar recién ahí.
const MARGEN_DE_ANTICIPO = '0px 0px -40px 0px'

// Envuelve contenido para que entre apareciendo, subiendo un poco y acercándose.
//
// La aparición se dispara cuando el elemento ENTRA EN PANTALLA, no cuando se monta. Es la
// diferencia entre que se sienta nuevo y que no se note: animando al montar, todo lo que está
// abajo del pliegue ya terminó su animación antes de que el usuario scrollee hasta ahí, así que
// no ve aparecer nada. Es lo que hace ScrollTrigger de GSAP; acá lo hace IntersectionObserver, que
// es del navegador y no agrega dependencias.
//
// Sirve igual para la transición de ruta: lo que ya está a la vista al montar dispara el observer
// en su primera lectura, así que no hace falta distinguir los dos casos.
//
// `orden` es la posición en una fila de apariciones y calcula el retardo solo: pasar 0, 1, 2… hace
// que las secciones se armen una atrás de la otra.
//
// Es un `div` y no un fragmento porque la animación necesita una caja propia (y el observer, algo
// a lo que mirar); `sx` queda expuesto para que quien la use pueda agregarle disposición sin
// envolverla en OTRO div.
export default function Aparicion({ children, orden = 0, sx }) {
  const referencia = useRef(null)

  // Arranca escondido solo si hay IntersectionObserver. Si el navegador no lo tiene, se muestra de
  // entrada: perder la animación es un detalle, dejar el contenido invisible es una pantalla rota.
  const [aparecio, setAparecio] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (aparecio) return

    const elemento = referencia.current
    if (!elemento) return

    const observer = new IntersectionObserver(
      entradas => {
        if (!entradas.some(entrada => entrada.isIntersecting)) return

        // Una sola vez: si volviera a animarse al re-entrar, bajar y subir la página convertiría
        // la lista en un parpadeo. El observer se desconecta acá mismo.
        setAparecio(true)
        observer.disconnect()
      },
      { threshold: PARTE_VISIBLE_NECESARIA, rootMargin: MARGEN_DE_ANTICIPO }
    )

    observer.observe(elemento)

    return () => observer.disconnect()
  }, [aparecio])

  const retardo = Math.min(orden, MAXIMO_ESCALONADO) * PASO_DEL_ESCALONADO

  return (
    <Box ref={referencia} sx={{ ...(aparecio ? apariciones({ retardo }) : ANTES_DE_APARECER), ...sx }}>
      {children}
    </Box>
  )
}
