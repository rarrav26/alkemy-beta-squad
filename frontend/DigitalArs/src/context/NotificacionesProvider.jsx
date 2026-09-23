import { useCallback, useEffect, useState } from 'react'
import { NotificacionesContext } from './notificacionesContext'
import { useAuth } from './authContext'
import { esAdministrador } from '../routes/rolesUtils'

const SIN_DATOS = { deLaSesion: null, items: [], noLeidas: 0 }

// Las notificaciones del usuario: la lista, el contador del globito y las acciones de marcado.
//
// Va por encima de las rutas y debajo de AuthProvider: necesita la sesión, y el panel se abre
// desde el encabezado, que se dibuja en todas las pantallas.
export default function NotificacionesProvider({ children }) {
  const {
    session,
    sesionVerificada,
    obtenerNotificaciones,
    marcarNotificacionLeida,
    marcarTodasLasNotificacionesLeidas
  } = useAuth()

  // Los datos se guardan junto con la sesión de la que salieron. Sin esa marca, al cerrar sesión
  // y entrar con otro usuario en la misma pestaña, el nuevo alcanzaba a ver por un instante las
  // notificaciones del anterior: quedaban en memoria hasta que llegaba la respuesta de la API.
  const [datos, setDatos] = useState(SIN_DATOS)
  const [error, setError] = useState('')

  // El administrador no tiene billetera, así que tampoco notificaciones: la API le responde 403.
  const activo = sesionVerificada && !esAdministrador(session)
  const sesionActual = activo ? session.token : null

  // Se decide durante el render y no limpiando el estado en un efecto: mientras la marca no
  // coincida, para la app no hay notificaciones, aunque en memoria queden las del usuario viejo.
  const sonDeEstaSesion = sesionActual !== null && datos.deLaSesion === sesionActual

  // Se elige el objeto entero y no campo por campo para que la lista vacía sea SIEMPRE la misma
  // de SIN_DATOS. Un `[]` escrito acá sería un array nuevo en cada render, y eso alcanzaría para
  // que marcarLeida cambie de identidad todo el tiempo.
  const datosVisibles = sonDeEstaSesion ? datos : SIN_DATOS

  const notificaciones = datosVisibles.items
  const noLeidas = datosVisibles.noLeidas

  // Está cargando cuando corresponde tener datos pero todavía no llegaron y no falló nada. Se
  // deduce en vez de guardarse en su propio estado, así no puede quedar en true si la respuesta
  // se perdió por el camino, ni en false con la lista todavía vacía.
  const cargando = activo && !sonDeEstaSesion && error === ''

  const recargar = useCallback(async () => {
    try {
      const respuesta = await obtenerNotificaciones()
      setDatos({
        deLaSesion: sesionActual,
        items: respuesta.items,
        noLeidas: respuesta.noLeidas
      })
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [obtenerNotificaciones, sesionActual])

  useEffect(() => {
    if (!activo) return

    // La regla set-state-in-effect desaconseja actualizar estado desde un efecto, y tiene razón
    // como norma general. Pero "pedir los datos al entrar" es justamente el caso que no se puede
    // resolver de otra forma sin sumar una librería de fetching (SWR y compañía) o reescribir
    // esto con Suspense, y ninguna de las dos se justifica para una sola llamada.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recargar()
  }, [activo, recargar])

  const marcarLeida = useCallback(
    async id => {
      const notificacion = notificaciones.find(item => item.id === id)

      // Ya estaba leída: no hay nada que cambiar ni que pedirle al servidor.
      if (!notificacion || notificacion.leida) return

      // Se cambia primero en pantalla para que el toque se sienta inmediato, y después se
      // confirma contra la API.
      setDatos(actuales => ({
        ...actuales,
        items: actuales.items.map(item =>
          item.id === id ? { ...item, leida: true } : item
        ),
        noLeidas: Math.max(0, actuales.noLeidas - 1)
      }))

      try {
        await marcarNotificacionLeida(id)
      } catch {
        // El servidor no aceptó el cambio, así que lo que hay en pantalla es mentira: se vuelve
        // a pedir todo en vez de intentar deshacer a mano.
        recargar()
      }
    },
    [notificaciones, marcarNotificacionLeida, recargar]
  )

  const marcarTodasLeidas = useCallback(async () => {
    setDatos(actuales => ({
      ...actuales,
      items: actuales.items.map(item => ({ ...item, leida: true })),
      noLeidas: 0
    }))

    try {
      await marcarTodasLasNotificacionesLeidas()
    } catch {
      recargar()
    }
  }, [marcarTodasLasNotificacionesLeidas, recargar])

  return (
    <NotificacionesContext.Provider
      value={{
        notificaciones,
        noLeidas,
        cargando,
        error,
        recargar,
        marcarLeida,
        marcarTodasLeidas
      }}
    >
      {children}
    </NotificacionesContext.Provider>
  )
}
