-- Seed obligatorio de referencia. No contiene usuarios ni contraseñas.
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @lockResult int;
    EXEC @lockResult = sp_getapplock @Resource = 'DigitalArs.ReferenceSeed',
        @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 30000;
    IF @lockResult < 0 THROW 50010, 'No se pudo bloquear el seed de referencia.', 1;

    DECLARE @Expected TABLE (id int PRIMARY KEY, descripcion nvarchar(50));
    INSERT INTO @Expected VALUES
        (1, N'DEPOSITO'), (2, N'TRANSFERENCIA_ENVIADA'), (3, N'TRANSFERENCIA_RECIBIDA');

    IF EXISTS (
        SELECT 1 FROM dbo.Tipo_Movimiento t JOIN @Expected e
            ON t.id = e.id OR t.descripcion = e.descripcion
        WHERE t.id <> e.id OR t.descripcion <> e.descripcion
    ) THROW 50011, 'El catálogo Tipo_Movimiento no coincide con los identificadores requeridos. No se modificó.', 1;

    INSERT INTO dbo.Tipo_Movimiento (id, descripcion)
    SELECT e.id, e.descripcion FROM @Expected e
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Tipo_Movimiento t WITH (UPDLOCK, HOLDLOCK) WHERE t.id = e.id);
    COMMIT;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;
END CATCH;
