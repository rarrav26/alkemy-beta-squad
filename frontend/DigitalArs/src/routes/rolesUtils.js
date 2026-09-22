import { getSessionUser } from './dashboardUtils.js'

export const ROL_ADMINISTRADOR = 'Administrador'
export const ROL_USUARIO = 'Usuario'

export function rolDeLaSesion(session) {
  const usuario = getSessionUser(session)
  if (!usuario) return null
  return usuario.role
}

export function esAdministrador(session) {
  return rolDeLaSesion(session) === ROL_ADMINISTRADOR
}

// Una ruta sin rol requerido es para cualquier usuario logueado.
export function puedeVerRuta(session, rolRequerido) {
  if (!rolRequerido) return true
  return rolDeLaSesion(session) === rolRequerido
}
