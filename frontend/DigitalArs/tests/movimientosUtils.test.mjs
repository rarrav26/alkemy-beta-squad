import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  construirConsulta,
  contarFiltrosAplicados,
  detalleDeLaContraparte,
  filtrosIniciales,
  formatearFechaCorta,
  hayMasPaginas,
  normalizarMovimiento,
  prefijoDelImporte,
  rangoDeFechasValido,
  sumarNuevosAlPrincipio,
  textoDelImporte,
  unirPaginasSinRepetidos
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

// Intl separa "$" del número con un espacio duro; para comparar se normaliza a espacio común.
function sinEspaciosDuros(texto) {
  return texto.replace(/\u00a0/g, ' ')
}

test('la fecha corta se escribe como dia y mes', () => {
  assert.equal(formatearFechaCorta('2026-09-24T15:00:00Z'), '24 de septiembre')
})

test('la fecha corta usa la hora argentina y no la del navegador', () => {
  // 01:00 UTC del 25 son las 22:00 del 24 en Argentina.
  assert.equal(formatearFechaCorta('2026-09-25T01:00:00Z'), '24 de septiembre')
})

test('el importe lleva signo segun sea credito, debito o desconocido', () => {
  assert.equal(prefijoDelImporte({ esCredito: true, esDebito: false }), '+')
  assert.equal(prefijoDelImporte({ esCredito: false, esDebito: true }), '-')
  assert.equal(prefijoDelImporte({ esCredito: false, esDebito: false }), '')
})

test('el texto del importe junta signo y monto en pesos', () => {
  const credito = { esCredito: true, esDebito: false, importe: 57.01 }
  const debito = { esCredito: false, esDebito: true, importe: 2000 }
  const desconocido = { esCredito: false, esDebito: false, importe: 10 }

  assert.equal(sinEspaciosDuros(textoDelImporte(credito)), '+ $ 57,01')
  assert.equal(sinEspaciosDuros(textoDelImporte(debito)), '- $ 2.000,00')
  assert.equal(sinEspaciosDuros(textoDelImporte(desconocido)), '$ 10,00')
})

const movimiento = id => ({ id })
const ids = lista => lista.map(item => item.id)

test('cargar mas suma la pagina nueva abajo', () => {
  const unidos = unirPaginasSinRepetidos([movimiento(9), movimiento(8)], [movimiento(7), movimiento(6)])

  assert.deepEqual(ids(unidos), [9, 8, 7, 6])
})

test('cargar mas no repite el movimiento que se corrio de pagina', () => {
  // Entró uno nuevo: el 8, que era el último de la página 1, ahora encabeza la página 2.
  const unidos = unirPaginasSinRepetidos([movimiento(9), movimiento(8)], [movimiento(8), movimiento(7)])

  assert.deepEqual(ids(unidos), [9, 8, 7])
})

test('un movimiento nuevo se suma arriba sin perder lo ya cargado', () => {
  const actuales = [movimiento(9), movimiento(8), movimiento(7)]
  const primeraPagina = [movimiento(10), movimiento(9)]

  assert.deepEqual(ids(sumarNuevosAlPrincipio(actuales, primeraPagina)), [10, 9, 8, 7])
})

test('hay mas paginas solo si la cargada no es la ultima', () => {
  assert.equal(hayMasPaginas(1, 3), true)
  assert.equal(hayMasPaginas(3, 3), false)
  assert.equal(hayMasPaginas(1, 1), false)
})

test('el rango de fechas vale con una sola fecha o con desde antes que hasta', () => {
  assert.equal(rangoDeFechasValido('', ''), true)
  assert.equal(rangoDeFechasValido('2026-09-01', ''), true)
  assert.equal(rangoDeFechasValido('', '2026-09-30'), true)
  assert.equal(rangoDeFechasValido('2026-09-01', '2026-09-30'), true)
  assert.equal(rangoDeFechasValido('2026-09-30', '2026-09-30'), true)
})

test('el rango de fechas no vale si desde es posterior a hasta', () => {
  assert.equal(rangoDeFechasValido('2026-09-30', '2026-09-01'), false)
})

test('una transferencia enviada dice para quien fue y una recibida de quien vino', () => {
  const enviada = { tipoRaw: 'TRANSFERENCIA_ENVIADA', contraparte: 'Tomas Destino' }
  const recibida = { tipoRaw: 'TRANSFERENCIA_RECIBIDA', contraparte: 'Lucia Prueba' }

  assert.equal(detalleDeLaContraparte(enviada), 'Para Tomas Destino')
  assert.equal(detalleDeLaContraparte(recibida), 'De Lucia Prueba')
})

test('lo que no es transferencia no lleva linea de contraparte', () => {
  assert.equal(detalleDeLaContraparte({ tipoRaw: 'DEPOSITO', contraparte: null }), null)
})

test('normalizar un movimiento conserva la contraparte y la deja en null si no viene', () => {
  const conContraparte = normalizarMovimiento({ id: 1, tipo: 'TRANSFERENCIA_ENVIADA', signo: 'DEBITO', importe: 10, contraparte: 'Tomas Destino' })
  const sinContraparte = normalizarMovimiento({ id: 2, tipo: 'DEPOSITO', signo: 'CREDITO', importe: 10 })

  assert.equal(conContraparte.contraparte, 'Tomas Destino')
  assert.equal(sinContraparte.contraparte, null)
})
