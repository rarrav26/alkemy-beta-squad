export const SECCION_INICIO = 'inicio'
export const SECCION_CUENTAS = 'cuentas'
export const SECCION_TARJETAS = 'tarjetas'
export const SECCION_MAS = 'mas'

// Las rutas que se abren desde el menú "Más" marcan esa pestaña, así el usuario sabe por dónde
// volver a entrar.
const RUTAS_DEL_MENU_MAS = ['/movimientos', '/perfil']

// Qué pestaña de la barra inferior se marca según la ruta actual. Sale de la URL y no de un
// estado guardado: así también acierta al recargar la página o al entrar desde un link.
export function seccionActivaDeLaRuta(ruta) {
  if (ruta === '/dashboard') return SECCION_INICIO
  if (ruta === '/cuentas') return SECCION_CUENTAS
  if (RUTAS_DEL_MENU_MAS.includes(ruta)) return SECCION_MAS
  return null
}
