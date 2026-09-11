import axios from 'axios'

// La URL base sale de VITE_API_URL (.env); el valor por defecto es el backend local.
const baseURL = (import.meta.env?.VITE_API_URL || 'https://localhost:7201').replace(/\/$/, '')

// Instancia única de Axios: todas las llamadas de la app salen desde acá.
export const api = axios.create({ baseURL })

export async function apiRequest(path, { token, body, signal, method = 'GET' } = {}) {
  try {
    const response = await api.request({
      url: path,
      method,
      signal,
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
  return new Error('No pudimos conectar con la API. Comprobá que esté iniciada y volvé a intentar.', { cause })
}

function errorDeRespuesta({ status, data }) {
  const detalles = data?.errors ? Object.values(data.errors).flat().join(' ') : ''
  const error = new Error([mensajePara(status, data), detalles].filter(Boolean).join(' '))
  error.status = status
  error.code = data?.code
  return error
}

function mensajePara(status, data) {
  if (status === 429) return 'Demasiados intentos. Esperá un minuto y volvé a intentar.'
  if (data?.message) return data.message
  if (status === 401) return 'Tu sesión venció. Volvé a ingresar.'
  if (status === 403) return 'No tenés permiso para realizar esta acción.'
  if (status >= 500) return 'El servidor no pudo completar la solicitud.'
  return 'Revisá los datos ingresados.'
}
