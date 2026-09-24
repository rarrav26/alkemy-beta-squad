// Los tres tipos que existen en la tabla Tipo_Movimiento. Si algún día se agrega
// uno nuevo en la base, hay que sumarlo acá para que la pantalla lo muestre con
// su nombre en castellano en vez del texto crudo.
export const tipoMovimientoMap = {
  DEPOSITO: 'Depósito',
  TRANSFERENCIA_ENVIADA: 'Transferencia enviada',
  TRANSFERENCIA_RECIBIDA: 'Transferencia recibida'
}

export function formatearTipoMovimiento(tipo = '') {
  if (!tipo) return 'Movimiento'

  if (tipoMovimientoMap[tipo]) {
    return tipoMovimientoMap[tipo]
  }

  return tipo
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ')
}

// Cada value es, tal cual, lo que acepta el parámetro ?tipo= de la API.
// Escribirlo distinto (por ejemplo 'todos' en vez de 'todas') hace que el
// backend responda 400, así que no tocar sin cambiar SignoDeMovimiento.cs.
export const opcionesTipo = [
  { value: 'todas', label: 'Todas' },
  { value: 'credito', label: 'Créditos (entra plata)' },
  { value: 'debito', label: 'Débitos (sale plata)' }
]

// La busqueda no esta aca: el texto que se tipea y el que ya se envio son dos
// estados distintos de la pantalla, y solo el enviado cuenta como filtro puesto.
export const filtrosIniciales = {
  tipo: 'todas',
  desde: '',
  hasta: ''
}

export const paginaVacia = {
  items: [],
  page: 1,
  pageSize: 5,
  totalItems: 0,
  totalPages: 1
}

// Con la hora incluida, dos movimientos del mismo dia se pueden distinguir entre
// si; mostrando solo la fecha todas las filas de un mismo dia se ven iguales.
const formatoFecha = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Argentina/Buenos_Aires'
})

export function formatearFecha(fecha) {
  return formatoFecha.format(new Date(fecha))
}

// "24 de septiembre": la fecha de las listas cortas (últimos movimientos), donde la hora
// sobra. La zona horaria va fija para que un movimiento de las 22 h no aparezca con la fecha
// del día siguiente en un navegador configurado en otra zona.
const formatoFechaCorta = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'America/Argentina/Buenos_Aires'
})

export function formatearFechaCorta(fecha) {
  return formatoFechaCorta.format(new Date(fecha))
}

// El signo que se le pone al importe. Un movimiento que el backend no sabe clasificar (signo
// DESCONOCIDO) va sin signo: no sabemos si suma o resta, así que no lo afirmamos.
export function prefijoDelImporte(movimiento) {
  if (movimiento.esCredito) return '+'
  if (movimiento.esDebito) return '-'
  return ''
}

const formatoPesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

// "+ $ 57,01" / "- $ 2.000,00" / "$ 10,00". El importe siempre llega en positivo desde la
// API y el signo lo decide el tipo de movimiento.
export function textoDelImporte(movimiento) {
  const monto = formatoPesos.format(Math.abs(movimiento.importe))
  const prefijo = prefijoDelImporte(movimiento)

  if (!prefijo) return monto
  return `${prefijo} ${monto}`
}

// Arma los parámetros de la consulta dejando afuera los filtros vacíos: para la
// API, un parámetro ausente significa "no filtres por esto".
export function construirConsulta(filtros, pagina, tamanioPagina) {
  const consulta = { page: pagina, pageSize: tamanioPagina }

  if (filtros.tipo !== 'todas') {
    consulta.tipo = filtros.tipo
  }

  if (filtros.desde) {
    consulta.desde = filtros.desde
  }

  if (filtros.hasta) {
    consulta.hasta = filtros.hasta
  }

  const busqueda = (filtros.busqueda ?? '').trim()

  if (busqueda) {
    consulta.busqueda = busqueda
  }

  return consulta
}

// Cuantos filtros hay puestos. Lo usan el mensaje de "sin resultados", el boton de
// limpiar y el contador del boton Filtros en pantallas chicas, asi el criterio de
// que cuenta como filtro esta escrito una sola vez.
export function contarFiltrosAplicados(filtros) {
  const puestos = [
    filtros.tipo !== 'todas',
    filtros.desde !== '',
    filtros.hasta !== '',
    (filtros.busqueda ?? '').trim() !== ''
  ]

  return puestos.filter(Boolean).length
}

export function hayFiltrosAplicados(filtros) {
  return contarFiltrosAplicados(filtros) > 0
}

export function normalizarMovimiento(movimiento) {
  const tipo = movimiento.tipo ?? ''
  const tipoFormateado = formatearTipoMovimiento(tipo)

  return {
    id: movimiento.id,
    fecha: movimiento.fecha,
    tipo: tipoFormateado,
    tipoRaw: tipo,
    importe: Number(movimiento.importe),
    descripcion: movimiento.descripcion || tipoMovimientoMap[tipo] || 'Movimiento',
    // Dos booleanos y no uno: un movimiento con signo DESCONOCIDO no es crédito ni
    // débito, y con un solo flag caía del lado del débito y se pintaba en rojo.
    esCredito: movimiento.signo === 'CREDITO',
    esDebito: movimiento.signo === 'DEBITO'
  }
}

// La API siempre responde con la misma forma (PaginaResponse<MovimientoResponse>),
// así que alcanza con leer esos campos. El total ya viene filtrado por el
// backend: es el que hace que el paginador diga la verdad.
export function normalizarRespuestaMovimientos(respuesta) {
  const items = Array.isArray(respuesta?.items) ? respuesta.items : []

  return {
    items: items.map(normalizarMovimiento),
    page: respuesta?.page ?? 1,
    pageSize: respuesta?.pageSize ?? 5,
    totalItems: respuesta?.totalItems ?? 0,
    // Sin resultados la API manda 0 páginas; para el cartel "Página 1 de N"
    // queda mejor mostrar 1 que 0.
    totalPages: Math.max(1, respuesta?.totalPages ?? 1)
  }
}

// --- Historial mobile: la lista crece con "Cargar más" en vez de cambiar de página. ---

// Los que todavía no están en la lista. Hace falta porque las páginas se corren: si entra un
// movimiento nuevo entre dos "Cargar más", todos bajan un lugar y la página siguiente repite
// el último de la anterior. Nunca faltan movimientos (solo se agregan arriba), solo se repiten.
function sinLosQueYaEstan(actuales, candidatos) {
  const idsActuales = new Set(actuales.map(movimiento => movimiento.id))
  return candidatos.filter(movimiento => !idsActuales.has(movimiento.id))
}

// "Cargar más": la página nueva va abajo, sin repetir los que ya se ven.
export function unirPaginasSinRepetidos(actuales, paginaNueva) {
  return [...actuales, ...sinLosQueYaEstan(actuales, paginaNueva)]
}

// Entró dinero: de la primera página solo interesan los que son nuevos, y van arriba. Así el
// usuario no pierde las páginas viejas que ya había cargado.
export function sumarNuevosAlPrincipio(actuales, primeraPagina) {
  return [...sinLosQueYaEstan(actuales, primeraPagina), ...actuales]
}

export function hayMasPaginas(paginaCargada, totalPaginas) {
  return paginaCargada < totalPaginas
}
