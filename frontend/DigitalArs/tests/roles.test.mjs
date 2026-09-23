import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ROL_ADMINISTRADOR,
  ROL_USUARIO,
  esAdministrador,
  puedeVerRuta
} from '../src/routes/rolesUtils.js'

const sesionDeUsuario = { user: { nombre: 'Ana', role: ROL_USUARIO } }
const sesionDeAdministrador = { user: { nombre: 'Admin', role: ROL_ADMINISTRADOR } }

test('sin sesión no se ve ninguna ruta que pida rol', () => {
  assert.equal(puedeVerRuta(null, ROL_USUARIO), false)
  assert.equal(puedeVerRuta(null, ROL_ADMINISTRADOR), false)
  assert.equal(esAdministrador(null), false)
})

test('una ruta sin rol requerido la ve cualquier usuario logueado', () => {
  assert.equal(puedeVerRuta(sesionDeUsuario), true)
  assert.equal(puedeVerRuta(sesionDeAdministrador), true)
})

test('solo el administrador ve las rutas de administración', () => {
  assert.equal(puedeVerRuta(sesionDeUsuario, ROL_ADMINISTRADOR), false)
  assert.equal(puedeVerRuta(sesionDeAdministrador, ROL_ADMINISTRADOR), true)
})

test('el administrador no ve las rutas del usuario regular', () => {
  assert.equal(puedeVerRuta(sesionDeAdministrador, ROL_USUARIO), false)
  assert.equal(puedeVerRuta(sesionDeUsuario, ROL_USUARIO), true)
})

test('esAdministrador distingue los dos roles', () => {
  assert.equal(esAdministrador(sesionDeAdministrador), true)
  assert.equal(esAdministrador(sesionDeUsuario), false)
})
