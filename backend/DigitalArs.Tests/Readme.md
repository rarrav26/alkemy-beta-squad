Tests Unitarios - Servicio de Transferencias (DigitalArs.Tests)
Este proyecto contiene la suite de pruebas unitarias automáticas desarrollada para validar las reglas de negocio críticas y la atomicidad del flujo de transferencias (TransferenciaService).

Tecnologías y Paquetes Utilizados
xUnit: Framework principal para definición y ejecución de pruebas.

Moq: Creación de dobles de prueba (mocks) sobre las interfaces de persistencia (ICuentaRepository, IUsuarioRepository, ITipoMovimientoRepository).

Microsoft.EntityFrameworkCore.InMemory: Proveedor de base de datos efímera en memoria RAM para probar transacciones y registros en Movimientos sin depender de una base física externa.

Casos de Prueba Cubiertos (TransferenciaServiceTests.cs)
TransferirAsync_ImporteInvalido_DeberiaFallar: Rechaza operaciones con importes menores o iguales a cero devolviendo DatosInvalidos.

TransferirAsync_SaldoInsuficiente_DeberiaFallar: Valida que una cuenta con saldo menor al monto a transferir devuelva SaldoInsuficiente.

TransferirAsync_CuentaDestinoInexistente_DeberiaFallar: Valida que si el alias/CVU no pertenece a ninguna cuenta se devuelva DestinoNoEncontrado.

TransferirAsync_CuentaDestinoInactiva_DeberiaFallar: Comprueba que si la cuenta existe pero el titular tiene is_active = false, retorne UsuarioDesactivado.

TransferirAsync_MismaCuenta_DeberiaFallar: Verifica la prohibición de realizar transferencias hacia la misma cuenta de origen (MismaCuenta).

TransferirAsync_FalloEnCredito_DeberiaRevertirYRetornarNoSePudoActualizar: Evalúa la atomicidad simulando un error en la acreditación del receptor; asegura la cancelación de la transacción, el retorno de NoSePudoActualizar y la ausencia de registros persistidos en Movimientos.

Cómo Ejecutar las Pruebas
Por Consola (CLI de .NET)
Abrir una terminal en la raíz de la solución o dentro de la carpeta DigitalArs.Tests y ejecutar:

dotnet test

Para ver el detalle de cada prueba individual durante la ejecución:

dotnet test --logger "console;verbosity=detailed"