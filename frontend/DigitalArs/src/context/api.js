const baseUrl = (import.meta.env?.VITE_API_URL || 'https://localhost:7201').replace(/\/$/, '')

export async function apiRequest(path, { token, body, signal, method = 'GET' } = {}) {
  let response
  try {
    response = await fetch(baseUrl + path, {
      method, signal,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('No pudimos conectar con la API. Comprobá que esté iniciada y volvé a intentar.', { cause: error })
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const details = data?.errors ? Object.values(data.errors).flat().join(' ') : ''
    const message = response.status === 429
      ? 'Demasiados intentos. Esperá un minuto y volvé a intentar.'
      : data?.message || (response.status === 401 ? 'Tu sesión venció. Volvé a ingresar.'
        : response.status === 403 ? 'No tenés permiso para realizar esta acción.'
        : response.status >= 500 ? 'El servidor no pudo completar la solicitud.' : 'Revisá los datos ingresados.')
    const error = new Error([message, details].filter(Boolean).join(' '))
    error.status = response.status
    error.code = data?.code
    throw error
  }
  return data
}
