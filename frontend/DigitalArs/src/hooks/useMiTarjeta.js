import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuth } from '../context/authContext'
import {
  cambiarCongelamientoTarjeta,
  darDeBajaTarjeta,
  generarTarjeta,
  obtenerMiTarjeta,
  pagarConTarjeta,
  revelarTarjeta
} from '../context/api'

// Cuánto se ve el código antes de que la tarjeta se dé vuelta sola. Suficiente para leer tres
// dígitos y copiarlos, no tanto como para dejarlos expuestos si el usuario se va del escritorio.
const SEGUNDOS_VISIBLE = 12

// Todo lo que se puede hacer con la tarjeta virtual del usuario: cargarla, generarla, revelar
// sus datos con la contraseña, congelarla, darla de baja y pagar. Vive en un hook y no en un
// componente para que el Dashboard de escritorio y la pantalla Tarjetas de mobile compartan
// exactamente el mismo comportamiento; cada pantalla solo decide cómo se ve.
//
// onPagoRealizado avisa el resultado de un pago a quien es dueño del saldo (la pantalla), igual
// que hacen el depósito y la transferencia.
export default function useMiTarjeta({ onPagoRealizado } = {}) {
  const { session } = useAuth()
  const token = session?.token

  const [tarjeta, setTarjeta] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Error de una acción (congelar, generar, dar de baja). Separado del error de carga: un fallo
  // al congelar no puede borrar la tarjeta de la pantalla, que es el bug que ya nos pasó en
  // Perfil con el alias.
  const [errorDeAccion, setErrorDeAccion] = useState('')
  const [accionEnCurso, setAccionEnCurso] = useState(false)

  // El número completo y el código, solo mientras están revelados.
  const [secreto, setSecreto] = useState(null)
  const [segundosRestantes, setSegundosRestantes] = useState(0)

  // De qué lado se está mirando la tarjeta. Es estado INDEPENDIENTE del secreto: girar es una
  // acción de ver y no pide contraseña, mientras revelar desbloquea los datos de las dos caras.
  // Antes el giro dependía del secreto, y por eso ver el código escondía el número.
  const [girada, setGirada] = useState(false)

  const [revelarAbierto, setRevelarAbierto] = useState(false)
  const [errorDePassword, setErrorDePassword] = useState('')
  const [verificando, setVerificando] = useState(false)

  const [bajaAbierta, setBajaAbierta] = useState(false)

  const [pagoAbierto, setPagoAbierto] = useState(false)
  const [errorDePago, setErrorDePago] = useState('')
  const [pagando, setPagando] = useState(false)
  // El comprobante del último pago. Mientras tiene valor, el modal muestra el comprobante en
  // lugar del formulario.
  const [comprobante, setComprobante] = useState(null)

  // Contador de reintentos: incrementarlo vuelve a disparar el efecto de carga. Es el mismo
  // patrón que usa useMiCuenta para su botón de reintento.
  const [intento, setIntento] = useState(0)

  // Se guarda en una ref y no en el estado porque el temporizador se cancela desde la limpieza
  // del efecto, donde leer el estado daría el valor viejo.
  const temporizador = useRef(null)

  useEffect(() => {
    if (!token) return

    const controlador = new AbortController()
    let vivo = true

    // La carga va dentro de una función async y el primer setState ocurre DESPUÉS del await:
    // llamar a setState de forma sincrónica en el cuerpo de un efecto dispara renders en
    // cascada, y la regla react-hooks/set-state-in-effect lo marca como error.
    async function cargar() {
      try {
        const datos = await obtenerMiTarjeta({ token, signal: controlador.signal })
        // null significa "todavía no generó ninguna", no un error.
        if (vivo) setTarjeta(datos)
      } catch (fallo) {
        if (vivo && fallo.name !== 'AbortError') setError(fallo.message)
      } finally {
        if (vivo) setCargando(false)
      }
    }

    cargar()

    return () => {
      vivo = false
      controlador.abort()
    }
  }, [token, intento])

  function reintentar() {
    setError('')
    setCargando(true)
    setIntento(valor => valor + 1)
  }

  // Oculta el código y cancela la cuenta regresiva. Se usa al agotarse el tiempo, al cambiar el
  // estado de la tarjeta y al desmontar.
  const ocultarSecreto = useCallback(() => {
    if (temporizador.current) {
      clearInterval(temporizador.current)
      temporizador.current = null
    }
    setSecreto(null)
    setSegundosRestantes(0)
  }, [])

  // El código nunca queda visible si la pantalla se desmonta (el usuario navega a otra): sin
  // esto, el temporizador seguiría corriendo sobre un componente que ya no existe.
  useEffect(() => ocultarSecreto, [ocultarSecreto])

  function girar() {
    setGirada(valor => !valor)
  }

  // El error se limpia al ABRIR y no al cerrar: limpiarlo al cerrar lo hace desaparecer a la
  // vista durante la animación del diálogo.
  function abrirRevelar() {
    setErrorDePassword('')
    setRevelarAbierto(true)
  }

  function cerrarRevelar() {
    setRevelarAbierto(false)
  }

  async function confirmarPassword(password) {
    setVerificando(true)
    setErrorDePassword('')

    try {
      const datos = await revelarTarjeta({ token, password })

      setSecreto(datos)
      setRevelarAbierto(false)
      setSegundosRestantes(SEGUNDOS_VISIBLE)

      // Deliberadamente NO se gira la tarjeta acá. Revelar desbloquea los datos de las dos
      // caras; cuál mirar lo decide el usuario girándola. Girar sola volvería a elegir por él,
      // que era el problema de la versión anterior.
      // Una cuenta regresiva visible y no un simple temporizador escondido: el usuario ve
      // cuánto le queda en vez de que el código desaparezca de golpe.
      temporizador.current = setInterval(() => {
        setSegundosRestantes(quedan => {
          if (quedan <= 1) {
            ocultarSecreto()
            return 0
          }
          return quedan - 1
        })
      }, 1000)
    } catch (fallo) {
      // El modal queda abierto para reintentar. El mensaje del backend ya dice cuántos
      // intentos quedan.
      setErrorDePassword(fallo.message)
    } finally {
      setVerificando(false)
    }
  }

  // Las acciones comparten el mismo manejo: bloquear, llamar, refrescar la tarjeta con lo que
  // devolvió el backend, y mostrar el error sin perder la tarjeta de pantalla.
  async function ejecutarAccion(accion) {
    setAccionEnCurso(true)
    setErrorDeAccion('')

    // Cualquier cambio de estado invalida el código revelado: si congelo la tarjeta, el código
    // no puede seguir a la vista.
    ocultarSecreto()

    try {
      const actualizada = await accion()
      setTarjeta(actualizada)
    } catch (fallo) {
      setErrorDeAccion(fallo.message)
    } finally {
      setAccionEnCurso(false)
    }
  }

  function limpiarErrorDeAccion() {
    setErrorDeAccion('')
  }

  function generar() {
    return ejecutarAccion(() => generarTarjeta({ token }))
  }

  function congelar() {
    return ejecutarAccion(() => cambiarCongelamientoTarjeta({ token, congelada: true }))
  }

  function descongelar() {
    return ejecutarAccion(() => cambiarCongelamientoTarjeta({ token, congelada: false }))
  }

  function abrirBaja() {
    setBajaAbierta(true)
  }

  function cerrarBaja() {
    setBajaAbierta(false)
  }

  async function darDeBaja() {
    setBajaAbierta(false)
    await ejecutarAccion(async () => {
      await darDeBajaTarjeta({ token })
      // Después de la baja no hay tarjeta vigente: se vuelve al estado "generá tu tarjeta",
      // que es justamente lo que habilita generar una nueva.
      return null
    })
  }

  // Se limpia el comprobante anterior al ABRIR y no al cerrar: limpiarlo al cerrar lo haría
  // desaparecer a la vista durante la animación del diálogo.
  function abrirPago() {
    setErrorDePago('')
    setComprobante(null)
    setPagoAbierto(true)
  }

  function cerrarPago() {
    setPagoAbierto(false)
  }

  async function pagar({ destino, importe, concepto }) {
    setPagando(true)
    setErrorDePago('')

    try {
      const resultado = await pagarConTarjeta({ token, destino, importe, concepto })

      // El modal NO se cierra: pasa a mostrar el comprobante con el número de operación, como
      // hace un banco. Lo cierra el usuario cuando terminó de leerlo.
      setComprobante(resultado)

      // El saldo lo maneja la pantalla, que es dueña del dato: se le avisa con la respuesta
      // del backend en vez de calcularlo acá. Mismo patrón que usan depósito y transferencia.
      onPagoRealizado?.(resultado)
    } catch (fallo) {
      // El modal queda abierto para corregir el destino o el importe.
      setErrorDePago(fallo.message)
    } finally {
      setPagando(false)
    }
  }

  // Pagar solo con la tarjeta ACTIVA y no vencida: una congelada no opera, y el backend lo
  // rechaza igual. Los demás permisos los decide el backend y vienen en la tarjeta.
  const puedePagar = Boolean(tarjeta) && tarjeta.estado === 'ACTIVA' && !tarjeta.estaVencida

  return {
    tarjeta,
    cargando,
    error,
    reintentar,
    errorDeAccion,
    limpiarErrorDeAccion,
    accionEnCurso,
    puedePagar,
    secreto,
    segundosRestantes,
    ocultarSecreto,
    girada,
    girar,
    revelarAbierto,
    abrirRevelar,
    cerrarRevelar,
    errorDePassword,
    verificando,
    confirmarPassword,
    generar,
    congelar,
    descongelar,
    bajaAbierta,
    abrirBaja,
    cerrarBaja,
    darDeBaja,
    pagoAbierto,
    abrirPago,
    cerrarPago,
    errorDePago,
    pagando,
    comprobante,
    pagar
  }
}
