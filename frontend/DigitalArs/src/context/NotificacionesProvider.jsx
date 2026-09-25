import { useCallback, useEffect, useState } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

import { NotificacionesContext } from './notificacionesContext'
import { api } from './api'
import { useAuth } from './authContext'
import { esIngresoDeDinero } from '../components/Notificaciones/notificacionesUtils'
import { esAdministrador } from '../routes/rolesUtils'

const SIN_DATOS = { deLaSesion: null, items: [], noLeidas: 0 }

// Tiene que coincidir letra por letra con el nombre que usa NotificadorSignalR en el backend.
// Si no coincide, SignalR no avisa nada: simplemente no llega el mensaje.
const EVENTO_DEL_HUB = 'NuevaNotificacion'

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

  // El cartel efímero. Es { mensaje, severidad } o null: sirve tanto para avisar que entró
  // dinero como para contar que una acción falló, así no hacen falta dos sistemas de avisos.
  const [aviso, setAviso] = useState(null)

  // Sube uno por cada aviso que llega por el socket. El Dashboard lo observa para volver a
  // pedir el saldo: el mensaje trae los datos de la notificación, no el saldo de la cuenta.
  const [avisosRecibidos, setAvisosRecibidos] = useState(0)

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

  // Lo que pasa cuando el servidor empuja un aviso. Solo usa la forma funcional de setState, así
  // que no depende de nada y no obliga a rehacer la conexión.
  const recibirDelHub = useCallback(notificacion => {
    // El alta en la lista y la suma al contador van en el MISMO updater: si el mensaje llegara
    // repetido, no puede pasar que la fila no se duplique pero el globito sí cuente dos veces.
    setDatos(actuales => {
      const yaEstaba = actuales.items.some(item => item.id === notificacion.id)
      if (yaEstaba) return actuales

      return {
        ...actuales,
        items: [notificacion, ...actuales.items],
        noLeidas: actuales.noLeidas + 1
      }
    })

    // Verde cuando entra dinero, igual que la fila del panel: el color del cartel y el de la
    // lista salen de la misma regla, así no pueden decir cosas distintas del mismo aviso.
    setAviso({
      mensaje: notificacion.mensaje,
      severidad: esIngresoDeDinero(notificacion) ? 'success' : 'info'
    })
    setAvisosRecibidos(actual => actual + 1)
  }, [])

  useEffect(() => {
    if (!activo) return

    const conexion = new HubConnectionBuilder()
      // La URL base sale de la instancia de Axios, que ya resolvió VITE_API_URL y le sacó la
      // barra final: esa lógica no se repite acá.
      .withUrl(`${api.defaults.baseURL}/hubs/notificaciones`, {
        // El navegador no deja mandar headers al abrir un WebSocket, así que el token viaja en
        // la query. El backend lo acepta solo en la ruta del hub.
        accessTokenFactory: () => sesionActual
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    conexion.on(EVENTO_DEL_HUB, recibirDelHub)

    // SignalR NO guarda lo que se envió mientras el cliente estaba desconectado, así que al
    // volver no alcanza con seguir escuchando: hay que pedir todo de nuevo.
    conexion.onreconnected(() => recargar())

    // Si la conexión no se puede abrir, la campana sigue funcionando con lo que trajo el REST:
    // el push es un atajo, no la fuente de verdad. SignalR ya loguea el motivo en la consola.
    conexion.start().catch(() => {})

    // Sin esto quedan conexiones colgadas al cerrar sesión o al entrar con otro usuario.
    return () => {
      conexion.stop()
    }
  }, [activo, sesionActual, recibirDelHub, recargar])

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
        setAviso({
          mensaje: 'No pudimos marcar la notificación como leída.',
          severidad: 'error'
        })
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
      setAviso({
        mensaje: 'No pudimos marcar las notificaciones como leídas.',
        severidad: 'error'
      })
      recargar()
    }
  }, [marcarTodasLasNotificacionesLeidas, recargar])

  const cerrarAviso = useCallback(() => setAviso(null), [])

  return (
    <NotificacionesContext.Provider
      value={{
        notificaciones,
        noLeidas,
        cargando,
        error,
        avisosRecibidos,
        recargar,
        marcarLeida,
        marcarTodasLeidas,
        // El cartel flotante lo dibuja AvisoDeNotificacion, no este provider: el provider está
        // por encima del ThemeProvider (ver main.jsx), y un cartel dibujado acá salía con el
        // tema por defecto de MUI en vez del de la app.
        aviso,
        cerrarAviso
      }}
    >
      {children}
    </NotificacionesContext.Provider>
  )
}
