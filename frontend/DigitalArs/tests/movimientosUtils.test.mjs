import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  construirConsulta,
  contarFiltrosAplicados,
  filtrosIniciales
} from '../src/routes/movimientosUtils.js'

// Lo que la pantalla le pasa a construirConsulta: los filtros del panel mas la
// busqueda ya enviada. Cada test cambia solo lo que necesita.
function filtros(cambios = {}) {
  return { ...filtrosIniciales, busqueda: '', ...cambios }
}

test('sin filtros solo manda la paginacion', () => {
  const consulta = construirConsulta(filtros(), 1, 5)

  assert.deepEqual(consulta, { page: 1, pageSize: 5 })
})

test('manda la busqueda cuando hay texto', () => {
  const consulta = construirConsulta(filtros({ busqueda: 'deposito' }), 1, 5)

  assert.equal(consulta.busqueda, 'deposito')
})

// Un parametro ausente significa "no filtres por esto": mandar busqueda vacia
// haria que el backend filtre por un texto que no coincide con ningun tipo y
// devuelva cero resultados.
test('omite la busqueda si es vacia o solo espacios', () => {
  assert.equal('busqueda' in construirConsulta(filtros(), 1, 5), false)
  assert.equal(
    'busqueda' in construirConsulta(filtros({ busqueda: '   ' }), 1, 5),
    false
  )
})

test('recorta los espacios de la busqueda', () => {
  const consulta = construirConsulta(filtros({ busqueda: '  transferencia  ' }), 1, 5)

  assert.equal(consulta.busqueda, 'transferencia')
})

test('omite el tipo cuando es todas', () => {
  const consulta = construirConsulta(filtros({ tipo: 'todas' }), 1, 5)

  assert.equal('tipo' in consulta, false)
})

test('manda tipo y fechas cuando estan puestos', () => {
  const consulta = construirConsulta(
    filtros({ tipo: 'credito', desde: '2026-09-01', hasta: '2026-09-30' }),
    2,
    20
  )

  assert.deepEqual(consulta, {
    page: 2,
    pageSize: 20,
    tipo: 'credito',
    desde: '2026-09-01',
    hasta: '2026-09-30'
  })
})

test('no cuenta filtros cuando no hay ninguno puesto', () => {
  assert.equal(contarFiltrosAplicados(filtros()), 0)
})

test('cuenta cada filtro puesto una vez', () => {
  const puestos = filtros({
    tipo: 'debito',
    desde: '2026-09-01',
    hasta: '2026-09-30',
    busqueda: 'deposito'
  })

  assert.equal(contarFiltrosAplicados(puestos), 4)
})

// El contador alimenta el boton "Filtros (N)" de pantallas chicas: una busqueda
// de puros espacios no filtra nada y no tiene que sumar.
test('una busqueda de solo espacios no cuenta como filtro', () => {
  assert.equal(contarFiltrosAplicados(filtros({ busqueda: '   ' })), 0)
})
