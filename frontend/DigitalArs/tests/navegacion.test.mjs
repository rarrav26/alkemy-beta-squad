import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SECCION_INICIO,
  SECCION_MAS,
  seccionActivaDeLaRuta
} from '../src/routes/navegacionUtils.js'

test('el dashboard marca la pestaña Inicio', () => {
  assert.equal(seccionActivaDeLaRuta('/dashboard'), SECCION_INICIO)
})

test('las rutas del menú Más marcan la pestaña Más', () => {
  assert.equal(seccionActivaDeLaRuta('/movimientos'), SECCION_MAS)
  assert.equal(seccionActivaDeLaRuta('/perfil'), SECCION_MAS)
})

test('una ruta que no está en la barra no marca ninguna pestaña', () => {
  assert.equal(seccionActivaDeLaRuta('/login'), null)
})
