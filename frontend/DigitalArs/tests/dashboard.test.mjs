import test from 'node:test'
import assert from 'node:assert/strict'
import { getSessionUser } from '../src/routes/dashboardUtils.js'

test('getSessionUser devuelve null cuando no hay sesión', () => {
  assert.equal(getSessionUser(null), null)
  assert.equal(getSessionUser(undefined), null)
  assert.equal(getSessionUser({}), null)
  assert.deepEqual(getSessionUser({ user: { nombre: 'Ana', role: 'Usuario' } }), { nombre: 'Ana', role: 'Usuario' })
})
