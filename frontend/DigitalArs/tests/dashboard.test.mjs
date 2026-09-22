import test from 'node:test'
import assert from 'node:assert/strict'
import { getSessionUser } from '../src/routes/dashboardUtils.js'
import { buildProfilePayload } from '../src/routes/perfilUtils.js'

test('getSessionUser devuelve null cuando no hay sesión', () => {
  assert.equal(getSessionUser(null), null)
  assert.equal(getSessionUser(undefined), null)
  assert.equal(getSessionUser({}), null)
  assert.deepEqual(getSessionUser({ user: { nombre: 'Ana', role: 'Usuario' } }), { nombre: 'Ana', role: 'Usuario' })
})

test('buildProfilePayload incluye currentPassword solo cuando cambia el email', () => {
  assert.deepEqual(
    buildProfilePayload({ nombre: 'Ana', apellido: 'García', email: 'ana@correo.com' }, 'ana@correo.com'),
    { nombre: 'Ana', apellido: 'García', email: 'ana@correo.com' }
  )

  assert.deepEqual(
    buildProfilePayload(
      { nombre: 'Ana', apellido: 'García', email: 'nueva@correo.com' },
      'ana@correo.com',
      'Secreto123'
    ),
    {
      nombre: 'Ana',
      apellido: 'García',
      email: 'nueva@correo.com',
      currentPassword: 'Secreto123'
    }
  )
})
