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

export const filtrosIniciales = {
  tipo: 'todas',
  desde: '',
  hasta: '',
  busqueda: ''
}

export const paginaVacia = {
  items: [],
  page: 1,
  pageSize: 5,
  totalItems: 0,
  totalPages: 1
}

const formatoFecha = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Argentina/Buenos_Aires'
})

export function formatearFecha(fecha) {
  return formatoFecha.format(new Date(fecha))
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

  return consulta
}

export function hayFiltrosAplicados(filtros) {
  return (
    filtros.tipo !== 'todas' ||
    filtros.desde !== '' ||
    filtros.hasta !== '' ||
    (filtros.busqueda ?? '').trim() !== ''
  )
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
    esCredito: movimiento.signo === 'CREDITO'
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
