import DepositoModal from './DepositoModal'
import TransferenciaModal from './TransferenciaModal'

// Los dos modales de dinero juntos, manejados por lo que devuelve useOperacionesDeDinero.
// Cada pantalla solo pone los botones que los abren; los modales son siempre estos.
export default function ModalesDeDinero({ operaciones, saldoDisponible }) {
  return (
    <>
      <DepositoModal
        open={operaciones.depositoAbierto}
        onClose={operaciones.cerrarDeposito}
        onDepositoRealizado={operaciones.depositoRealizado}
      />
      <TransferenciaModal
        open={operaciones.transferenciaAbierta}
        onClose={operaciones.cerrarTransferencia}
        saldoDisponible={saldoDisponible}
        onTransferenciaRealizada={operaciones.transferenciaRealizada}
      />
    </>
  )
}
