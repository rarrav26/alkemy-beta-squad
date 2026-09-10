import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apiRequest } from '../src/context/api.js'

test('envía JSON y Bearer a la API', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://localhost:7201/api/usuarios')
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(options.body), { nombre: 'Prueba' })
    return new Response(JSON.stringify({ usuarioId: 1 }), { status: 201 })
  })
  assert.deepEqual(await apiRequest('/api/usuarios', { method: 'POST', token: 'test-token', body: { nombre: 'Prueba' } }), { usuarioId: 1 })
})

test('login público no envía token y conserva el error genérico del servidor', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined)
    return new Response(JSON.stringify({ message: 'Credenciales incorrectas.', code: 'INVALID_CREDENTIALS' }), { status: 401 })
  })
  await assert.rejects(apiRequest('/api/auth/login', { method: 'POST', body: {} }),
    { message: 'Credenciales incorrectas.', status: 401, code: 'INVALID_CREDENTIALS' })
})

test('conserva el mensaje claro de usuario desactivado', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ message: 'Tu usuario está desactivado.', code: 'USER_INACTIVE' }), { status: 403 }))
  await assert.rejects(apiRequest('/api/auth/login'), { message: 'Tu usuario está desactivado.', status: 403 })
})

test('presenta validaciones de Identity', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ message: 'Revisá tus datos.', errors: { Password: ['Contraseña débil.'] } }), { status: 400 }))
  await assert.rejects(apiRequest('/api/auth/register'), { message: 'Revisá tus datos. Contraseña débil.' })
})

test('maneja 429 sin cuerpo JSON', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 429 }))
  await assert.rejects(apiRequest('/api/auth/login'), { status: 429, message: 'Demasiados intentos. Esperá un minuto y volvé a intentar.' })
})

test('fallo de red tiene un mensaje útil', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(apiRequest('/api/setup/status'), /No pudimos conectar/)
})

test('cancelar la carga conserva AbortError', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('Aborted', 'AbortError') })
  await assert.rejects(apiRequest('/api/setup/status'), { name: 'AbortError' })
})

test('admite respuestas sin contenido', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }))
  assert.equal(await apiRequest('/api/usuarios/1/active'), null)
})