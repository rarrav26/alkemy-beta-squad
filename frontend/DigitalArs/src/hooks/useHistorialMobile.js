import { useEffect, useRef, useState } from 'react'

import { useAuth } from '../context/authContext'
import { useNotificaciones } from '../context/notificacionesContext'
import {
  construirConsulta,
  filtrosIniciales,
  hayMasPaginas,
  normalizarRespuestaMovimientos,
  sumarNuevosAlPrincipio,
  unirPaginasSinRepetidos
} from '../routes/movimientosUtils'

// De a cuántos movimientos crece la lista con cada "Cargar más".
const MOVIMIENTOS_POR_PAGINA = 20

// Los datos del historial completo en mobile. A diferencia de la pantalla de escritorio, acá
// no se cambia de página: la lista crece hacia abajo con "Cargar más".
//
// Cuándo se vuelve a pedir la primera página:
// - al cambiar un filtro (búsqueda, tipo o fechas): la lista arranca de nuevo;
// - al entrar dinero en tiempo real: solo se suman arriba los movimientos nuevos, sin perder
//   las páginas viejas que el usuario ya había cargado. Reemplaza al refresco cada 15 s.
export default function useHistorialMobile() {
  const { obtenerMovimientos } = useAuth()
  const { avisosRecibidos } = useNotificaciones()

  const [filtros, setFiltros] = useState(filtrosIniciales)
  const [busquedaAplicada, setBusquedaAplicada] = useState('')
  const [movimientos, setMovimientos] = useState([])
  const [paginaCargada, setPaginaCargada] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [cargandoMas, setCargandoMas] = useState(false)
  const [errorAlCargarMas, setErrorAlCargarMas] = useState('')

  // Los filtros con los que se armó la lista que se ve. Lo leen "Cargar más" y el refresco
  // por dinero entrante, que no tienen que volver a correr cada vez que cambia un filtro.
  const filtrosDeLaLista = useRef({ ...filtrosIniciales, busqueda: '' })

  // Cambia con cada lista nueva. Si el usuario cambia un filtro mientras "Cargar más" espera
  // la respuesta, esa página es de la lista vieja y se descarta en vez de mezclarse.
  const versionDeLaLista = useRef(0)

  const { tipo, desde, hasta } = filtros

  useEffect(() => {
    const controller = new AbortController()
    const filtrosNuevos = { tipo, desde, hasta, busqueda: busquedaAplicada }
    filtrosDeLaLista.current = filtrosNuevos
    versionDeLaLista.current += 1

    async function cargarPrimeraPagina() {
      setCargando(true)
      setError('')
      setErrorAlCargarMas('')

      try {
        const consulta = construirConsulta(filtrosNuevos, 1, MOVIMIENTOS_POR_PAGINA)
        const respuesta = await obtenerMovimientos(consulta, controller.signal)
        if (controller.signal.aborted) return

        const datos = normalizarRespuestaMovimientos(respuesta)
        setMovimientos(datos.items)
        setPaginaCargada(1)
        setTotalPaginas(datos.totalPages)
      } catch (err) {
        if (controller.signal.aborted) return

        // Se vacía la lista para no dejar a la vista el resultado del filtro anterior como si
        // fuera el del filtro nuevo.
        setMovimientos([])
        setError(err.message)
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false)
        }
      }
    }

    cargarPrimeraPagina()

    return () => controller.abort()
  }, [obtenerMovimientos, tipo, desde, hasta, busquedaAplicada])

  useEffect(() => {
    if (avisosRecibidos === 0) return

    const controller = new AbortController()
    const consulta = construirConsulta(filtrosDeLaLista.current, 1, MOVIMIENTOS_POR_PAGINA)

    obtenerMovimientos(consulta, controller.signal)
      .then(respuesta => {
        if (controller.signal.aborted) return

        const datos = normalizarRespuestaMovimientos(respuesta)
        setMovimientos(actuales => sumarNuevosAlPrincipio(actuales, datos.items))
        setTotalPaginas(datos.totalPages)
      })
      // Un refresco de fondo que falla deja la lista como está: el usuario no lo pidió.
      .catch(() => {})

    return () => controller.abort()
  }, [avisosRecibidos, obtenerMovimientos])

  async function cargarMas() {
    if (cargandoMas) return
    if (!hayMasPaginas(paginaCargada, totalPaginas)) return

    const versionAlPedir = versionDeLaLista.current
    const paginaSiguiente = paginaCargada + 1

    setCargandoMas(true)
    setErrorAlCargarMas('')

    try {
      const consulta = construirConsulta(filtrosDeLaLista.current, paginaSiguiente, MOVIMIENTOS_POR_PAGINA)
      const respuesta = await obtenerMovimientos(consulta)
      if (versionAlPedir !== versionDeLaLista.current) return

      const datos = normalizarRespuestaMovimientos(respuesta)
      setMovimientos(actuales => unirPaginasSinRepetidos(actuales, datos.items))
      setPaginaCargada(paginaSiguiente)
      setTotalPaginas(datos.totalPages)
    } catch (err) {
      if (versionAlPedir !== versionDeLaLista.current) return
      setErrorAlCargarMas(err.message)
    } finally {
      setCargandoMas(false)
    }
  }

  function aplicarBusqueda(texto) {
    setBusquedaAplicada(texto.trim())
  }

  function elegirTipo(tipoNuevo) {
    setFiltros(anteriores => ({ ...anteriores, tipo: tipoNuevo }))
  }

  function aplicarFechas({ desde: desdeNuevo, hasta: hastaNuevo }) {
    setFiltros(anteriores => ({ ...anteriores, desde: desdeNuevo, hasta: hastaNuevo }))
  }

  function limpiarFiltros() {
    setFiltros(filtrosIniciales)
    setBusquedaAplicada('')
  }

  return {
    movimientos,
    cargando,
    error,
    cargandoMas,
    errorAlCargarMas,
    hayMas: hayMasPaginas(paginaCargada, totalPaginas),
    filtrosAplicados: { tipo, desde, hasta, busqueda: busquedaAplicada },
    cargarMas,
    aplicarBusqueda,
    elegirTipo,
    aplicarFechas,
    limpiarFiltros
  }
}
