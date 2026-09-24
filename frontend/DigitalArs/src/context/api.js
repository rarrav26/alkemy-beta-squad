import axios from 'axios'

// La URL base sale de VITE_API_URL (.env); el valor por defecto es el backend local.
const baseURL = (
  import.meta.env?.VITE_API_URL || 'https://localhost:7201'
).replace(/\/$/, '')

// Instancia única de Axios: todas las llamadas de la app salen desde acá.
export const api = axios.create({ baseURL })

export async function apiRequest(
  path,
  { token, body, signal, method = 'GET', params } = {}
) {
  try {
    const response = await api.request({
      url: path,
      method,
      signal,
      ...(params ? { params } : {}),
      ...(body ? { data: body } : {}),
      ...(token ? { headers: { Authorization: 'Bearer ' + token } } : {})
    })
    return contenidoDe(response)
  } catch (error) {
    throw traducirError(error)
  }
}

// Un 204 no trae cuerpo y Axios lo entrega como cadena vacía: lo normalizamos a null.
function contenidoDe(response) {
  if (response.data === '' || response.data === undefined) return null
  return response.data
}

function traducirError(error) {
  if (error.name === 'AbortError') return error
  if (axios.isCancel(error)) return errorDeCancelacion()
  if (!error.response) return errorDeConexion(error)
  return errorDeRespuesta(error.response)
}

// La app decide si una carga fue cancelada por el nombre del error, no por su mensaje.
function errorDeCancelacion() {
  const error = new Error('La solicitud fue cancelada.')
  error.name = 'AbortError'
  return error
}

function errorDeConexion(cause) {
  return new Error(
    'No pudimos conectar con la API. Comprobá que esté iniciada y volvé a intentar.',
    { cause }
  )
}

function errorDeRespuesta({ status, data }) {
  const detalles = data?.errors ? Object.values(data.errors).flat() : []

  // Una misma validación puede llegar repetida: el backend la manda en message y
  // además bajo cada campo al que afecta (desde y hasta, por ejemplo). Sin el
  // Set, el usuario lee tres veces la misma frase.
  const partes = [...new Set([mensajePara(status, data), ...detalles])]

  const error = new Error(partes.filter(Boolean).join(' '))
  error.status = status
  error.code = data?.code
  return error
}

function mensajePara(status, data) {
  if (typeof data === 'string' && data) return data
  // El mensaje del backend tiene prioridad sobre el genérico, incluso en un 429: el límite de
  // intentos del revelado de tarjeta explica cuánto hay que esperar, y el texto genérico decía
  // otro tiempo. El limitador de pedidos responde sin cuerpo, así que ahí sigue valiendo el
  // genérico de abajo.
  if (data?.message) return data.message
  if (status === 429)
    return 'Demasiados intentos. Esperá un minuto y volvé a intentar.'
  if (data?.detail) return data.detail
  if (data?.title) return data.title
  if (status === 401) return 'Tu sesión venció. Volvé a ingresar.'
  if (status === 403) return 'No tenés permiso para realizar esta acción.'
  if (status >= 500) return 'El servidor no pudo completar la solicitud.'
  return 'Revisá los datos ingresados.'
}
export async function obtenerUsuariosAdmin({ token, page = 1, pageSize = 10, busqueda = '', signal } = {}) {
  const termino = busqueda.trim()

  return apiRequest('/api/Usuarios', {
    method: 'GET',
    token,
    // El parámetro se omite cuando está vacío para no mandar "busqueda=" en la URL.
    params: termino ? { page, pageSize, busqueda: termino } : { page, pageSize },
    signal
  })
}

// Edición de otro usuario por parte de un administrador: solo nombre, apellido y email.
export async function actualizarUsuarioAdmin({ token, id, nombre, apellido, email, signal } = {}) {
  return apiRequest(`/api/Usuarios/${id}`, {
    method: 'PATCH',
    token,
    body: { nombre, apellido, email },
    signal
  })
}

// Alta y baja lógica. Responde 204 sin cuerpo, así que apiRequest devuelve null.
export async function cambiarEstadoUsuarioAdmin({ token, id, isActive, signal } = {}) {
  return apiRequest(`/api/Usuarios/${id}/active`, {
    method: 'PATCH',
    token,
    body: { isActive },
    signal
  })
}

// Detalle de un usuario para el administrador: trae datos personales, cuenta, alias, CVU y
// estado. Si no existe, apiRequest rechaza con un error cuyo .message ya trae el mensaje que
// mandó el backend (ver mensajePara).
export async function obtenerUsuarioPorId({ token, id, signal } = {}) {
  return apiRequest(`/api/Usuarios/${id}`, {
    method: 'GET',
    token,
    signal
  })
}
export async function obtenerMiPerfil({ token, signal } = {}) {
  // 1. Obtenemos los datos personales desde /api/Auth/me
  const usuario = await apiRequest('/api/Auth/me', {
    method: 'GET',
    token,
    signal
  })

  // 2. Intentamos obtener los datos de la cuenta (CVU, alias, saldo)
  // Si es un admin sin cuenta o da 404, devolvemos null en cuenta sin romper
  let cuenta = null
  try {
    cuenta = await apiRequest('/api/Cuentas/me', {
      method: 'GET',
      token,
      signal
    })
  } catch (error) {
    // Si no tiene cuenta bancaria (404), ignoramos el error
    cuenta = null
  }

  return {
    ...usuario,
    cuenta
  }
}

// ==========================================================================================
// TARJETAS
// ==========================================================================================

// Devuelve la tarjeta vigente, o null si el usuario todavía no generó ninguna.
//
// El 404 se traduce a null en vez de propagarse como error: "no tengo tarjeta" es un estado
// normal del dashboard, no una falla. Cualquier otro error sí se propaga, para no esconder un
// problema real detrás de un estado vacío.
export async function obtenerMiTarjeta({ token, signal } = {}) {
  try {
    return await apiRequest('/api/Tarjetas/me', { method: 'GET', token, signal })
  } catch (error) {
    if (error?.status === 404) return null
    throw error
  }
}

export async function generarTarjeta({ token, signal } = {}) {
  return apiRequest('/api/Tarjetas', { method: 'POST', token, signal })
}

// Devuelve el número completo y el código de seguridad. Exige la contraseña.
// Es POST y no GET porque la contraseña va en el cuerpo, y así el número no queda en el
// historial del navegador ni en los logs de acceso.
export async function revelarTarjeta({ token, password, signal } = {}) {
  return apiRequest('/api/Tarjetas/me/revelar', {
    method: 'POST',
    token,
    body: { password },
    signal
  })
}

// Un solo helper para congelar y descongelar: es la misma transición en dos sentidos.
export async function cambiarCongelamientoTarjeta({ token, congelada, signal } = {}) {
  return apiRequest('/api/Tarjetas/me/congelada', {
    method: 'PATCH',
    token,
    body: { congelada },
    signal
  })
}

// Baja permanente. No se puede revertir.
export async function darDeBajaTarjeta({ token, signal } = {}) {
  return apiRequest('/api/Tarjetas/me/baja', { method: 'PATCH', token, signal })
}