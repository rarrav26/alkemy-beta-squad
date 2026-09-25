/* ============================================================================
   DigitalArs - Billetera Virtual
   Script Notificaciones (v.002): avisos que no nacen de un movimiento
   Requiere: Notificaciones(v.001).sql

   POR QUE ESTE CAMBIO
   La v.001 declara movimiento_id como NOT NULL, con este comentario:
   "NOT NULL: hoy todo aviso nace de un movimiento". Era cierto cuando los únicos
   avisos eran depósitos y transferencias.

   Las tarjetas rompen esa suposición: congelar, descongelar, generar y dar de
   baja son eventos que el usuario quiere ver en su campana y que NO mueven
   dinero, así que no tienen un movimiento asociado. La alternativa habría sido
   inventar un movimiento de importe cero para poder colgarles el aviso, lo que
   contaminaría el historial de movimientos y el cálculo del saldo con filas que
   no representan ninguna operación de dinero.

   Por eso la columna pasa a aceptar NULL: "este aviso no viene de un
   movimiento".

   *** ESTE SCRIPT ES ADITIVO: NO TIENE NINGUN DROP ***
   Relajar un NOT NULL no pierde datos ni invalida filas existentes. Todas las
   notificaciones ya cargadas siguen teniendo su movimiento_id.

   LA CLAVE FORANEA SE MANTIENE
   FK_Notificaciones_Movimientos sigue en pie. Una clave foránea no verifica las
   filas cuyo valor es NULL, así que un aviso sin movimiento se guarda bien, y
   uno que SI trae movimiento_id sigue obligado a apuntar a un movimiento real.

   Es idempotente: si la columna ya acepta NULL, no hace nada.
   ============================================================================ */

USE DigitalArs;
GO


IF EXISTS (SELECT 1
             FROM sys.columns
            WHERE object_id = OBJECT_ID(N'dbo.Notificaciones')
              AND name = N'movimiento_id'
              AND is_nullable = 0)
BEGIN
    /* ALTER COLUMN conserva el tipo y solo cambia la nulabilidad. No hace falta
       tocar la FK ni el índice: ninguno de los dos incluye esta columna. */
    ALTER TABLE dbo.Notificaciones
        ALTER COLUMN movimiento_id INT NULL;

    PRINT 'Notificaciones.movimiento_id ahora acepta NULL.';
END
ELSE
    PRINT 'Notificaciones.movimiento_id ya aceptaba NULL: sin cambios.';
GO
