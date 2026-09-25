import { useState } from 'react'

// Qué modal de dinero está abierto y el aviso de éxito de la última operación. Lo comparten
// todas las pantallas que ofrecen depositar y transferir (Dashboard, Inicio mobile, Cuentas),
// así el comportamiento es el mismo en todas. El saldo no vive acá: lo actualiza useMiCuenta a
// través de las dos funciones que se reciben.
export default function useOperacionesDeDinero({ aplicarDeposito, aplicarTransferencia }) {
  const [depositoAbierto, setDepositoAbierto] = useState(false)
  const [transferenciaAbierta, setTransferenciaAbierta] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')

  // Al abrir una operación nueva se borra el aviso de la anterior, para que no quede un
  // "Transferencia realizada" viejo arriba de un depósito que recién empieza.
  function abrirDeposito() {
    setMensajeExito('')
    setDepositoAbierto(true)
  }

  function abrirTransferencia() {
    setMensajeExito('')
    setTransferenciaAbierta(true)
  }

  function cerrarDeposito() {
    setDepositoAbierto(false)
  }

  function cerrarTransferencia() {
    setTransferenciaAbierta(false)
  }

  function cerrarMensajeExito() {
    setMensajeExito('')
  }

  function depositoRealizado(resultado) {
    aplicarDeposito(resultado)
    setMensajeExito(resultado.message)
  }

  function transferenciaRealizada(resultado) {
    aplicarTransferencia(resultado)
    setMensajeExito(resultado?.message || 'Transferencia realizada con éxito.')
  }

  // Un pago con tarjeta descuenta del saldo, y el backend devuelve el saldo ya calculado,
  // igual que un depósito: por eso se aplica con la misma función. No se resta acá, para que
  // la pantalla diga exactamente lo que quedó guardado.
  function pagoRealizado(resultado) {
    aplicarDeposito(resultado)
    setMensajeExito(resultado.message)
  }

  return {
    depositoAbierto,
    transferenciaAbierta,
    mensajeExito,
    abrirDeposito,
    abrirTransferencia,
    cerrarDeposito,
    cerrarTransferencia,
    cerrarMensajeExito,
    depositoRealizado,
    transferenciaRealizada,
    pagoRealizado
  }
}
