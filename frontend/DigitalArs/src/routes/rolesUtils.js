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

// La sesión cuenta como activa recién cuando está VERIFICADA contra el servidor, no con solo
// estar en sessionStorage: si no, un usuario desactivado alcanzaba a ver la navegación de la
// app mientras se comprobaba su estado. Recibe el mismo objeto que devuelve useAuth().
export function esSesionActiva({ ready, connectionError, session, sesionVerificada }) {
  if (!ready) return false
  if (connectionError) return false
  if (!session) return false
  return Boolean(sesionVerificada)
}

// Una ruta sin rol requerido es para cualquier usuario logueado.
export function puedeVerRuta(session, rolRequerido) {
  if (!rolRequerido) return true
  return rolDeLaSesion(session) === rolRequerido
}
