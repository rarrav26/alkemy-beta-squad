import test from 'node:test'
import assert from 'node:assert/strict'
import {
  esIngresoDeDinero,
  llegoDeOtraPersona
} from '../src/components/Notificaciones/notificacionesUtils.js'

const aviso = titulo => ({ titulo })

test('el cartel flotante aparece solo cuando otra persona te manda plata', () => {
  assert.equal(llegoDeOtraPersona(aviso('Transferencia recibida')), true)
  assert.equal(llegoDeOtraPersona(aviso('Pago recibido')), true)
})

test('las operaciones propias no llevan cartel flotante', () => {
  assert.equal(llegoDeOtraPersona(aviso('Ingreso de dinero')), false)
  assert.equal(llegoDeOtraPersona(aviso('Transferencia enviada')), false)
  assert.equal(llegoDeOtraPersona(aviso('Pago con tarjeta')), false)
  assert.equal(llegoDeOtraPersona(aviso('Tarjeta congelada')), false)
})

test('un aviso sin titulo no rompe ninguna de las dos reglas', () => {
  assert.equal(llegoDeOtraPersona(null), false)
  assert.equal(esIngresoDeDinero(undefined), false)
})

test('se pinta de verde todo aviso en el que entra plata', () => {
  assert.equal(esIngresoDeDinero(aviso('Ingreso de dinero')), true)
  assert.equal(esIngresoDeDinero(aviso('Transferencia recibida')), true)
  assert.equal(esIngresoDeDinero(aviso('Pago recibido')), true)
})

test('lo que no suma plata no se pinta de verde', () => {
  assert.equal(esIngresoDeDinero(aviso('Transferencia enviada')), false)
  assert.equal(esIngresoDeDinero(aviso('Pago con tarjeta')), false)
  assert.equal(esIngresoDeDinero(aviso('Tarjeta generada')), false)
})
