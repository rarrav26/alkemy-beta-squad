import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from './authContext'
import { apiRequest } from './api'

const storageKey = 'digitalars.session'
function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey))
    return value?.token && Date.parse(value.expiresAt) > Date.now()
      ? value
      : null
  } catch {
    return null
  }
}

// Un usuario desactivado no debe poder seguir usando la app. Como el JWT es stateless, sigue
// siendo válido hasta que expire: quien ya tenía la sesión abierta cuando lo desactivaron
// llegaba al dashboard y podía recorrer perfil y movimientos, viendo solo un cartel de error
// dentro de una tarjeta. Cualquier respuesta que informe la baja corta la sesión acá mismo,
// que es el equivalente del lado del cliente a invalidar la sesión en el servidor.
// Se aceptan las dos grafías del código porque el login lo escribe a mano ('USER_INACTIVE')
// y el resto de los endpoints lo derivan del nombre del enum ('UsuarioDesactivado').
function esUsuarioDesactivado(error) {
  return error?.status === 403 &&
    (error?.code === 'USER_INACTIVE' || error?.code === 'UsuarioDesactivado')
}

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const [ready, setReady] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [attempt, setAttempt] = useState(0)
  // Por qué se cerró la sesión sola. Sin esto, un usuario desactivado en medio de su sesión
  // aparecía de golpe en el login sin ninguna explicación.
  const [motivoDeCierre, setMotivoDeCierre] = useState('')

  // Token cuya validez ya se confirmó contra el servidor. Se guarda el token y no un booleano
  // para que, al cambiar de cuenta, la verificación vuelva a correr en vez de darse por hecha.
  const [tokenVerificado, setTokenVerificado] = useState(null)

  // Mientras no esté verificada, la app no debe mostrar NADA de sesión iniciada: ni el
  // contenido de las rutas ni la navegación del encabezado. Si no, un usuario desactivado
  // alcanzaba a ver la barra con "Mi cuenta / Perfil" antes de que lo sacaran.
  const sesionVerificada = Boolean(session?.token) && tokenVerificado === session.token

  const logout = useCallback((motivo = '') => {
    sessionStorage.removeItem(storageKey)
    setMotivoDeCierre(typeof motivo === 'string' ? motivo : '')
    setTokenVerificado(null)
    setSession(null)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function initialize() {
      try {
        const status = await apiRequest('/api/setup/status', {
          signal: controller.signal
        })
        const saved = readSession()
        let restored = null
        if (saved) {
          try {
            const user = await apiRequest('/api/auth/me', {
              token: saved.token,
              signal: controller.signal
            })
            restored = { ...saved, user }
          } catch (error) {
            if (error.status !== 401) throw error
          }
        }
        if (controller.signal.aborted) return
        if (!restored) sessionStorage.removeItem(storageKey)
        setSession(restored)
        if (status.requiresSetup)
          throw new Error(
            'La instalación no está completa. Contactá al responsable de la aplicación.'
          )
        setConnectionError('')
        setReady(true)
      } catch (error) {
        if (controller.signal.aborted) return
        setConnectionError(error.message)
        setReady(true)
      }
    }
    initialize()
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    if (!session) return
    const timeout = setTimeout(
      logout,
      Math.max(0, Date.parse(session.expiresAt) - Date.now())
    )
    return () => clearTimeout(timeout)
  }, [session, logout])

  async function saveLogin(result) {
    const user = await apiRequest('/api/auth/me', { token: result.token })
    const value = { token: result.token, expiresAt: result.expiresAt, user }
    sessionStorage.setItem(storageKey, JSON.stringify(value))
    setMotivoDeCierre('')
    setSession(value)
  }
  async function login(data) {
    await saveLogin(
      await apiRequest('/api/auth/login', { method: 'POST', body: data })
    )
  }
  async function register(data) {
    return apiRequest('/api/auth/register', { method: 'POST', body: data })
  }
  async function initialPassword(data) {
    await saveLogin(
      await apiRequest('/api/auth/initial-password', {
        method: 'POST',
        body: data
      })
    )
  }

  const authenticatedRequest = useCallback(
    async (path, options = {}) => {
      if (!session?.token) {
        throw new Error('Iniciá sesión para continuar.')
      }

      try {
        return await apiRequest(path, {
          ...options,
          token: session.token
        })
      } catch (error) {
        if (esUsuarioDesactivado(error)) {
          logout('Tu usuario fue desactivado. Contactá al administrador para regularizar la situación.')
        } else if (error.status === 401) {
          logout()
        }
        throw error
      }
    },
    [session, logout]
  )
  const obtenerMiCuenta = useCallback(
    signal => authenticatedRequest('/api/cuentas/me', { signal }),
    [authenticatedRequest]
  )

  // Comprueba contra el servidor que la sesión todavía sirve, ANTES de dibujar una pantalla
  // protegida. Lo que hay en sessionStorage puede ser viejo: al usuario lo pueden haber
  // desactivado mientras tenía la sesión abierta.
  // La API responde 401 tanto a un token vencido como al de un usuario desactivado, así que el
  // mensaje no puede decir "venció": al volver a ingresar, el login le explica si está dado de
  // baja. La rama del 403 USER_INACTIVE queda por si algún endpoint lo informa así.
  const verificarSesionActiva = useCallback(
    async signal => {
      if (!session?.token) return false

      try {
        await apiRequest('/api/Usuarios/me', { token: session.token, signal })
        return true
      } catch (error) {
        if (error.name === 'AbortError') throw error

        if (esUsuarioDesactivado(error)) {
          logout('Tu usuario fue desactivado. Contactá al administrador para regularizar la situación.')
          return false
        }

        if (error.status === 401) {
          logout('Tu sesión se cerró. Volvé a ingresar.')
          return false
        }

        // Un problema de red no debería cerrar la sesión: se deja pasar y que la pantalla
        // muestre su propio error de carga.
        return true
      }
    },
    [session, logout]
  )

  const actualizarAliasCuenta = useCallback(
    alias =>
      authenticatedRequest('/api/Cuentas/me/alias', {
        method: 'PATCH',
        body: { alias }
      }),
    [authenticatedRequest]
  )

  const obtenerMiPerfil = useCallback(
    signal => authenticatedRequest('/api/Usuarios/me', { signal }),
    [authenticatedRequest]
  )

  const actualizarMiPerfil = useCallback(
    data =>
      authenticatedRequest('/api/Usuarios/me', {
        method: 'PATCH',
        body: data
      }),
    [authenticatedRequest]
  )

  // consulta lleva page y pageSize, y opcionalmente los filtros tipo, desde y
  // hasta. Se manda tal cual viene: quien llama decide qué filtros aplica.
  const obtenerMovimientos = useCallback(
    (consulta, signal) =>
      authenticatedRequest('/api/movimientos', { signal, params: consulta }),
    [authenticatedRequest]
  )

  const ingresarDinero = useCallback(
    importe =>
      authenticatedRequest('/api/movimientos/depositos', {
        method: 'POST',
        body: { importe }
      }),
    [authenticatedRequest]
  )

  // Se manda importe 1 porque el backend valida este paso con el mismo DTO que la
  // transferencia, que exige un importe mayor a cero. El importe real va en transferir.
  const resolverDestinoDeTransferencia = useCallback(
    destino =>
      authenticatedRequest('/api/Transferencias/resolver-destino', {
        method: 'POST',
        body: { destino, importe: 1 }
      }),
    [authenticatedRequest]
  )

  const transferir = useCallback(
    (destino, importe) =>
      authenticatedRequest('/api/Transferencias', {
        method: 'POST',
        body: { destino, importe }
      }),
    [authenticatedRequest]
  )
  function createUser(data) {
    return authenticatedRequest('/api/usuarios', { method: 'POST', body: data })
  }
  function retry() {
    setReady(false)
    setConnectionError('')
    setAttempt(value => value + 1)
  }

  // Verificación central de la sesión: corre cada vez que cambia el token. Hasta que termine,
  // sesionVerificada es false y la app no muestra nada de sesión iniciada.
  useEffect(() => {
    if (!session?.token) return

    const controller = new AbortController()
    const token = session.token

    async function verificar() {
      try {
        const valida = await verificarSesionActiva(controller.signal)
        if (controller.signal.aborted) return
        if (valida) setTokenVerificado(token)
      } catch {
        // Cancelación al desmontar o al cambiar de sesión: no hay nada que hacer.
      }
    }

    verificar()

    return () => controller.abort()
  }, [session, verificarSesionActiva])

  return (
    <AuthContext.Provider
      value={{
        session,
        ready,
        connectionError,
        motivoDeCierre,
        sesionVerificada,
        login,
        register,
        initialPassword,
        createUser,
        logout,
        retry,
        obtenerMiCuenta,
        verificarSesionActiva,
        actualizarAliasCuenta,
        obtenerMiPerfil,
        actualizarMiPerfil,
        obtenerMovimientos,
        ingresarDinero,
        resolverDestinoDeTransferencia,
        transferir
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
