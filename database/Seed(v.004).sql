/* ============================================================================
   DigitalArs - Billetera Virtual
   Script Seed (v.004): movimientos para probar el historial (HU-011)
   Requiere: Create(v.002).sql, Identity(v.001).sql y Seed(v.003).sql

   Carga 20 movimientos variados sobre la cuenta de un usuario de prueba:
     - los tres tipos (DEPOSITO, TRANSFERENCIA_ENVIADA, TRANSFERENCIA_RECIBIDA),
     - repartidos entre mayo y septiembre de 2026, para probar rangos de fechas,
     - suficientes para que la paginacion de a 5 tenga varias paginas.

   IMPORTANTE: la columna fecha se guarda en UTC, porque asi la escribe la API
   (DateTime.UtcNow). El endpoint devuelve esas mismas fechas en hora argentina
   (-03:00), asi que restarles 3 horas para saber como se van a ver.

   ============================================================================ */

USE DigitalArs;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @EmailDestino NVARCHAR(256) = N'test.etapa2@example.com';

DECLARE @Cuenta INT = (
    SELECT c.id
    FROM dbo.Cuentas c
    INNER JOIN dbo.Usuarios u ON u.id = c.usuario_id
    WHERE u.email = @EmailDestino);

/* Se valida antes de abrir la transaccion: si el usuario no existe o no tiene
   cuenta, insertar con @Cuenta en NULL fallaria con un error de clave foranea
   que no explica nada. */
IF @Cuenta IS NULL
BEGIN
    RAISERROR(N'No hay cuenta para el email indicado. Revisar @EmailDestino.', 16, 1);
    RETURN;
END;

/* Marca de agua para poder repetir el script: este seed es lo unico que carga
   movimientos anteriores a agosto de 2026 para esta cuenta. Si ya hay uno, el
   seed ya corrio. */
DECLARE @MarcaDelSeed DATETIME2(3) = '2026-08-01T00:00:00';

BEGIN TRANSACTION;

/* ----------------------------------------------------------------------------
   Movimientos
   tipo_movimiento_id: 1 = DEPOSITO, 2 = TRANSFERENCIA_ENVIADA,
                       3 = TRANSFERENCIA_RECIBIDA.
   transferencia_id queda en NULL: la tabla Transferencias todavia no existe.
   ---------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Movimientos
               WHERE cuenta_id = @Cuenta AND fecha < @MarcaDelSeed)
    INSERT INTO dbo.Movimientos (cuenta_id, tipo_movimiento_id, transferencia_id, importe, fecha)
    VALUES
        (@Cuenta, 1, NULL, 12000.00, '2026-05-04T13:10:00'),
        (@Cuenta, 2, NULL,  1500.00, '2026-05-19T20:45:00'),
        (@Cuenta, 3, NULL,  3200.50, '2026-06-02T11:05:00'),
        (@Cuenta, 1, NULL,   800.00, '2026-06-15T15:30:00'),
        (@Cuenta, 2, NULL,  2200.00, '2026-06-28T18:20:00'),
        (@Cuenta, 3, NULL,   950.75, '2026-07-03T09:40:00'),
        (@Cuenta, 1, NULL,  4500.00, '2026-07-11T22:15:00'),
        (@Cuenta, 2, NULL,   130.25, '2026-07-20T14:05:00'),
        (@Cuenta, 3, NULL,  6100.00, '2026-07-31T23:50:00'),
        (@Cuenta, 1, NULL,   300.00, '2026-08-05T12:00:00'),
        (@Cuenta, 2, NULL,    75.50, '2026-08-12T16:35:00'),
        (@Cuenta, 3, NULL,  1800.00, '2026-08-19T10:25:00'),
        (@Cuenta, 1, NULL,  2600.00, '2026-08-26T19:55:00'),
        (@Cuenta, 2, NULL,   990.00, '2026-08-31T13:45:00'),
        (@Cuenta, 1, NULL,   150.00, '2026-09-01T02:30:00'),  /* 31/08 23:30 en Argentina */
        (@Cuenta, 3, NULL,  7400.00, '2026-09-03T17:10:00'),
        (@Cuenta, 2, NULL,  3050.00, '2026-09-07T08:20:00'),
        (@Cuenta, 1, NULL,   500.00, '2026-09-10T21:40:00'),
        (@Cuenta, 2, NULL,   640.00, '2026-09-12T14:15:00'),
        (@Cuenta, 3, NULL,  2750.00, '2026-09-15T01:00:00');  /* 14/09 22:00 en Argentina */


/* ----------------------------------------------------------------------------
   Saldo al dia con el historial

   El historial no toca el saldo, pero la pantalla de inicio muestra los dos
   juntos: si el saldo no coincide con la suma de los movimientos, la prueba
   manual parece rota cuando no lo esta. Se recalcula entero, asi el bloque
   tambien se puede repetir.
   ---------------------------------------------------------------------------- */
UPDATE c
SET c.saldo = ISNULL((
        SELECT SUM(CASE WHEN m.tipo_movimiento_id = 2 THEN -m.importe ELSE m.importe END)
        FROM dbo.Movimientos m
        WHERE m.cuenta_id = c.id), 0)
FROM dbo.Cuentas c
WHERE c.id = @Cuenta;


COMMIT TRANSACTION;

GO
