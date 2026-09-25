export const SECCION_INICIO = 'inicio'
export const SECCION_CUENTAS = 'cuentas'
export const SECCION_TARJETAS = 'tarjetas'
export const SECCION_MAS = 'mas'

// Estas dos no son pestañas de la barra inferior: en mobile viven adentro del menú "Más", y en
// escritorio suben a la barra lateral como secciones propias.
export const SECCION_MOVIMIENTOS = 'movimientos'
export const SECCION_PERFIL = 'perfil'

// Secciones del administrador. No tiene billetera, así que ninguna se solapa con las de
// billetera: Inicio y Mi perfil son las únicas entradas que los dos roles comparten.
export const SECCION_USUARIOS = 'usuarios'
export const SECCION_NUEVO_USUARIO = 'nuevo-usuario'

// ---------------------------------------------------------------------------
// Este archivo es la ÚNICA fuente de las tres navegaciones de la app: la barra inferior de
// mobile, el menú "Más" que la acompaña, y la barra lateral de escritorio. Cada una recorre su
// lista para dibujarse, y las funciones de abajo recorren la misma lista para saber qué marcar.
//
// Así no hay dos mapas de rutas que se puedan desincronizar: agregar una sección es agregar una
// fila. Y como cada rol tiene su propia lista, a nadie se le ofrece navegar a una pantalla que
// su rol no puede abrir (las rutas de billetera están detrás de Protected rol={ROL_USUARIO}, así
// que una pestaña hacia ellas rebotaría al administrador a /dashboard).
//
// Los íconos NO viven acá porque este archivo no tiene JSX: están en
// components/Navegacion/iconosDeSeccion.js, buscados por id, y los comparten las tres
// navegaciones para que una sección se vea igual en cualquier ancho de pantalla.
// ---------------------------------------------------------------------------

// Pestañas de la barra inferior (mobile). Tres y no cuatro: la cuarta es siempre "Más", que no
// es una sección sino la hoja con el resto.
export const PESTANAS_DE_MOBILE = [
  { id: SECCION_INICIO, etiqueta: 'Inicio', to: '/dashboard' },
  { id: SECCION_CUENTAS, etiqueta: 'Cuentas', to: '/cuentas' },
  { id: SECCION_TARJETAS, etiqueta: 'Tarjetas', to: '/tarjetas' }
]

// Las del administrador. "Registrar" y no "Registrar usuario" como en la barra lateral: en un
// teléfono de 360px una etiqueta de dos palabras largas se corta.
export const PESTANAS_DE_MOBILE_DEL_ADMIN = [
  { id: SECCION_INICIO, etiqueta: 'Inicio', to: '/dashboard' },
  { id: SECCION_USUARIOS, etiqueta: 'Usuarios', to: '/admin/usuarios' },
  { id: SECCION_NUEVO_USUARIO, etiqueta: 'Registrar', to: '/usuarios/nuevo' }
]

// Lo que va en el menú "Más". Son las secciones que no entran en la barra inferior; en
// escritorio no existe este menú y cada una tiene su propia fila.
export const SECCIONES_DEL_MENU_MAS = [
  { id: SECCION_MOVIMIENTOS, etiqueta: 'Movimientos', to: '/movimientos' },
  { id: SECCION_PERFIL, etiqueta: 'Mi perfil', to: '/perfil' }
]

export const SECCIONES_DEL_MENU_MAS_DEL_ADMIN = [
  { id: SECCION_PERFIL, etiqueta: 'Mi perfil', to: '/perfil' }
]

// Secciones de la barra lateral (escritorio). Acá hay lugar para que cada una sea su propia
// entrada, así que no hay menú "Más": Movimientos y Perfil salen de adentro y suben a la barra.
export const SECCIONES_DE_ESCRITORIO = [
  { id: SECCION_INICIO, etiqueta: 'Inicio', to: '/dashboard' },
  { id: SECCION_CUENTAS, etiqueta: 'Cuentas', to: '/cuentas' },
  { id: SECCION_TARJETAS, etiqueta: 'Tarjetas', to: '/tarjetas' },
  { id: SECCION_MOVIMIENTOS, etiqueta: 'Movimientos', to: '/movimientos' },
  { id: SECCION_PERFIL, etiqueta: 'Mi perfil', to: '/perfil' }
]

// Las del administrador. Antes su panel se alcanzaba desde un botón de texto adentro del
// Inicio, así que la gestión de usuarios no figuraba en ninguna navegación: acá pasa a ser una
// sección como cualquier otra.
export const SECCIONES_DE_ESCRITORIO_DEL_ADMIN = [
  { id: SECCION_INICIO, etiqueta: 'Inicio', to: '/dashboard' },
  { id: SECCION_USUARIOS, etiqueta: 'Usuarios', to: '/admin/usuarios' },
  { id: SECCION_NUEVO_USUARIO, etiqueta: 'Registrar usuario', to: '/usuarios/nuevo' },
  { id: SECCION_PERFIL, etiqueta: 'Mi perfil', to: '/perfil' }
]

export function pestanasDeMobile(esAdmin) {
  return esAdmin ? PESTANAS_DE_MOBILE_DEL_ADMIN : PESTANAS_DE_MOBILE
}

export function seccionesDelMenuMas(esAdmin) {
  return esAdmin ? SECCIONES_DEL_MENU_MAS_DEL_ADMIN : SECCIONES_DEL_MENU_MAS
}

export function seccionesDeEscritorio(esAdmin) {
  return esAdmin ? SECCIONES_DE_ESCRITORIO_DEL_ADMIN : SECCIONES_DE_ESCRITORIO
}

// Qué pestaña de la barra inferior se marca según la ruta actual. Sale de la URL y no de un
// estado guardado: así también acierta al recargar la página o al entrar desde un link.
//
// Una ruta que se abre desde el menú "Más" marca esa pestaña, así el usuario sabe por dónde
// volver a entrar.
export function seccionActivaDeLaRuta(ruta, esAdmin = false) {
  const pestana = pestanasDeMobile(esAdmin).find(seccion => seccion.to === ruta)
  if (pestana) return pestana.id

  const enElMenu = seccionesDelMenuMas(esAdmin).some(seccion => seccion.to === ruta)
  if (enElMenu) return SECCION_MAS

  return null
}

// Misma idea pero para la barra lateral, donde no hay menú "Más" y cada sección se marca a sí
// misma. Busca en la lista del rol que corresponda, así una ruta del administrador nunca marca
// una fila del usuario regular.
export function seccionActivaDeLaRutaEnEscritorio(ruta, esAdmin = false) {
  return seccionesDeEscritorio(esAdmin).find(seccion => seccion.to === ruta)?.id ?? null
}
