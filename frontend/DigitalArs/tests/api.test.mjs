import { test } from 'node:test'
import assert from 'node:assert/strict'
import axios from 'axios'
import { api, apiRequest } from '../src/context/api.js'

// El adapter es el punto donde Axios hace la llamada real. Reemplazarlo nos deja
// probar el mapeo de respuestas y errores sin levantar la API.
function usarAdapter(t, adapter) {
  const original = api.defaults.adapter
  api.defaults.adapter = adapter
  t.after(() => { api.defaults.adapter = original })
}

function responder(data, status = 200) {
  return config => Promise.resolve({ data, status, statusText: '', headers: {}, config })
}

function fallar(status, data) {
  return () => Promise.reject(Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: { status, data }
  }))
}

test('envía JSON y Bearer a la API', async t => {
  usarAdapter(t, config => {
    assert.equal(config.baseURL + config.url, 'https://localhost:7201/api/usuarios')
    assert.equal(config.headers.get('Authorization'), 'Bearer test-token')
    assert.equal(config.headers.get('Content-Type'), 'application/json')
    assert.deepEqual(JSON.parse(config.data), { nombre: 'Prueba' })
    return responder({ usuarioId: 1 }, 201)(config)
  })
  assert.deepEqual(await apiRequest('/api/usuarios', { method: 'POST', token: 'test-token', body: { nombre: 'Prueba' } }), { usuarioId: 1 })
})

test('login público no envía token y conserva el error genérico del servidor', async t => {
  usarAdapter(t, config => {
    assert.equal(config.headers.get('Authorization'), undefined)
    return fallar(401, { message: 'Credenciales incorrectas.', code: 'INVALID_CREDENTIALS' })()
  })
  await assert.rejects(apiRequest('/api/auth/login', { method: 'POST', body: {} }),
    { message: 'Credenciales incorrectas.', status: 401, code: 'INVALID_CREDENTIALS' })
})

test('conserva el mensaje claro de usuario desactivado', async t => {
  usarAdapter(t, fallar(403, { message: 'Tu usuario está desactivado.', code: 'USER_INACTIVE' }))
  await assert.rejects(apiRequest('/api/auth/login'), { message: 'Tu usuario está desactivado.', status: 403 })
})

test('presenta validaciones de Identity', async t => {
  usarAdapter(t, fallar(400, { message: 'Revisá tus datos.', errors: { Password: ['Contraseña débil.'] } }))
  await assert.rejects(apiRequest('/api/auth/register'), { message: 'Revisá tus datos. Contraseña débil.' })
})

test('maneja 429 sin cuerpo JSON', async t => {
  usarAdapter(t, fallar(429, ''))
  await assert.rejects(apiRequest('/api/auth/login'), { status: 429, message: 'Demasiados intentos. Esperá un minuto y volvé a intentar.' })
})

test('fallo de red tiene un mensaje útil', async t => {
  usarAdapter(t, () => Promise.reject(Object.assign(new Error('Network Error'), { isAxiosError: true })))
  await assert.rejects(apiRequest('/api/setup/status'), /No pudimos conectar/)
})

test('cancelar la carga conserva AbortError', async t => {
  usarAdapter(t, () => Promise.reject(new axios.CanceledError()))
  await assert.rejects(apiRequest('/api/setup/status'), { name: 'AbortError' })
})

test('admite respuestas sin contenido', async t => {
  usarAdapter(t, responder('', 204))
  assert.equal(await apiRequest('/api/usuarios/1/active'), null)
})
