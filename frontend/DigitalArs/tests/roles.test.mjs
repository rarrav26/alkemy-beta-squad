import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ROL_ADMINISTRADOR,
  ROL_USUARIO,
  esAdministrador,
  esSesionActiva,
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

const estadoVerificado = {
  ready: true,
  connectionError: '',
  session: sesionDeUsuario,
  sesionVerificada: true
}

test('la sesión está activa solo si está lista, sin error de conexión y verificada', () => {
  assert.equal(esSesionActiva(estadoVerificado), true)
})

test('una sesión guardada pero todavía sin verificar no cuenta como activa', () => {
  assert.equal(esSesionActiva({ ...estadoVerificado, sesionVerificada: false }), false)
})

test('sin sesión, antes de estar lista o con error de conexión no hay sesión activa', () => {
  assert.equal(esSesionActiva({ ...estadoVerificado, session: null }), false)
  assert.equal(esSesionActiva({ ...estadoVerificado, ready: false }), false)
  assert.equal(esSesionActiva({ ...estadoVerificado, connectionError: 'Sin conexión' }), false)
})
