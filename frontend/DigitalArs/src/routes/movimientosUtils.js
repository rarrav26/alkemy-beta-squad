export const tipoMovimientoMap = {
  DEPOSITO: 'Depósito',
  TRANSFERENCIA_ENVIADA: 'Transferencia enviada',
  TRANSFERENCIA_RECIBIDA: 'Transferencia recibida',
  RETIRO: 'Retiro',
  PAGO: 'Pago'
}

export const opcionesTipo = [
  { value: 'todos', label: 'Todos' },
  ...Object.entries(tipoMovimientoMap).map(([value, label]) => ({ value, label }))
]

const formatoFecha = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Argentina/Buenos_Aires'
})

export function getTipoMovimientoLabel(tipoMovimientoId) {
  return tipoMovimientoMap[tipoMovimientoId] ?? 'Movimiento'
}

export function formatearFecha(fecha) {
  return formatoFecha.format(new Date(fecha))
}

export function normalizarMovimiento(movimiento, index = 0) {
  const tipo = (movimiento.tipo ?? '').toUpperCase()
  const signo = (movimiento.signo ?? 'DEBITO').toUpperCase()
  const importe = Number(movimiento.importe ?? 0)

  return {
    id: movimiento.id ?? index + 1,
    fecha: movimiento.fecha ?? new Date().toISOString(),
    tipo,
    signo,
    importe,
    descripcion: tipoMovimientoMap[tipo] ?? 'Movimiento',
    esCredito: signo === 'CREDITO',
    etiqueta: `${tipoMovimientoMap[tipo] ?? 'Movimiento'} · ${formatearFecha(movimiento.fecha ?? Date.now())}`
  }
}

export function normalizarRespuestaMovimientos(response, fallbackPage = 1) {
  const items = Array.isArray(response?.items)
    ? response.items
    : Array.isArray(response)
      ? response
      : []

  const paginaActual = Number(response?.page ?? fallbackPage) || fallbackPage
  const tamanioPagina = Number(response?.pageSize ?? response?.page_size ?? (items.length || 5)) || 5
  const totalItems = Number(
    response?.totalCount ??
    response?.total ??
    response?.totalItems ??
    response?.count ??
    items.length
  ) || items.length

  const totalPaginas = totalItems > 0
    ? Math.max(1, Math.ceil(totalItems / Math.max(tamanioPagina, 1)))
    : 1

  return {
    items: items.map(normalizarMovimiento),
    page: paginaActual,
    pageSize: tamanioPagina,
    totalItems,
    totalPages: totalPaginas
  }
}
