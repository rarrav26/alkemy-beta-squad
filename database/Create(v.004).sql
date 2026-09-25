/* ============================================================================
   DigitalArs - Billetera Virtual
   Script Create (v.004): pagos con tarjeta y auditoria de eventos de tarjeta
   Requiere: Create(v.003).sql

   ALCANCE DE ESTA VERSION
   Tres cambios, y la distincion entre los dos primeros es la decision de diseno
   central de este script:

     1. dbo.TarjetaEventos       -> tabla nueva de AUDITORIA
     2. Movimientos.tarjeta_id   -> columna nueva, para los pagos
     3. Tipo_Movimiento id 4     -> PAGO_CON_TARJETA

   POR QUE LOS EVENTOS DE TARJETA NO VAN EN Movimientos
   Congelar, descongelar, generar y dar de baja NO mueven dinero. Meterlos en
   Movimientos tendria tres consecuencias malas:
     - Movimientos alimenta la pantalla de historial del usuario: veria
       "Tarjeta congelada" mezclado entre sus transferencias.
     - CK_Movimientos_Importe exige importe > 0, y un congelamiento no tiene
       importe. Habria que relajar el CHECK (debilitando una garantia real del
       dominio de dinero) o inventar un importe falso.
     - SignoDeMovimiento clasifica cada tipo en CREDITO o DEBITO. Un
       congelamiento no es ninguno de los dos y quedaria como DESCONOCIDO, sin
       lugar en los filtros del front.
   Por eso la auditoria tiene su propia tabla.

   POR QUE UN PAGO SI VA EN Movimientos
   Un pago con tarjeta es dinero que sale de la cuenta: es un DEBITO con importe
   positivo, igual que una transferencia enviada. Encaja en la tabla, en el CHECK
   y en la taxonomia que ya existen, y asi el pago aparece en el historial y en
   el saldo sin ningun caso especial.

   *** ESTE SCRIPT ES ADITIVO: NO TIENE NINGUN DROP ***
   Es idempotente: cada bloque comprueba si su cambio ya esta aplicado.
   ============================================================================ */

USE DigitalArs;
GO

/* Obligatorio para el indice filtrado del final, igual que en v.003. */
SET QUOTED_IDENTIFIER ON;
GO


/* ============================================================================
   1. TarjetaEventos
   Bitacora de lo que le paso a cada tarjeta. Append-only, igual que
   Movimientos: un evento registrado no se corrige ni se borra.

   Para que sirve: responde "cuantas veces congelo su tarjeta" y "cuantas dio de
   baja" con un GROUP BY, sin tener que deducirlo del estado actual. El estado de
   la tarjeta dice como esta HOY; esta tabla dice como llego hasta ahi, que es
   justo lo que el estado no puede contar.

   Apunta a la tarjeta y no a la cuenta: una cuenta tiene varias tarjetas a lo
   largo del tiempo, y el evento pertenece a una en concreto. La cuenta y el
   usuario se alcanzan por JOIN desde Tarjetas.
   ============================================================================ */
IF OBJECT_ID('dbo.TarjetaEventos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TarjetaEventos
    (
        id          INT             NOT NULL IDENTITY(1,1),
        tarjeta_id  INT             NOT NULL,

        /* Mismo criterio que Tarjetas.estado: texto y no un numero con catalogo
           aparte, porque esta tabla se consulta a mano para auditar y leer
           'CONGELADA' es mejor que leer un 2. */
        tipo        VARCHAR(20)     NOT NULL,

        /* UTC, igual que Movimientos.fecha y Tarjetas.fecha_alta. */
        fecha       DATETIME2(3)    NOT NULL CONSTRAINT DF_TarjetaEventos_Fecha DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_TarjetaEventos PRIMARY KEY CLUSTERED (id),

        CONSTRAINT FK_TarjetaEventos_Tarjetas
            FOREIGN KEY (tarjeta_id) REFERENCES dbo.Tarjetas (id),

        /* Los cuatro eventos que registra el servicio. GENERADA se guarda aunque
           la fila de Tarjetas ya tenga fecha_alta: asi la bitacora se lee sola,
           sin cruzarla con otra tabla para saber cuando empezo todo. */
        CONSTRAINT CK_TarjetaEventos_Tipo CHECK
            (tipo IN ('GENERADA', 'CONGELADA', 'DESCONGELADA', 'DADA_DE_BAJA'))
    );

    /* Las consultas de auditoria son "los eventos de esta tarjeta, mas nuevos
       primero" y "contar por tipo". Este indice cubre las dos. */
    CREATE INDEX IX_TarjetaEventos_Tarjeta_Fecha
        ON dbo.TarjetaEventos (tarjeta_id, fecha DESC);

    PRINT 'Tabla dbo.TarjetaEventos creada.';
END
ELSE
    PRINT 'Tabla dbo.TarjetaEventos ya existia: sin cambios.';
GO


/* ============================================================================
   2. Movimientos.tarjeta_id
   Con que tarjeta se hizo el pago. NULLABLE porque la enorme mayoria de los
   movimientos no son pagos: un deposito y una transferencia no tienen tarjeta.

   Es el mismo patron que transferencia_id, que ya esta en la tabla: una columna
   opcional que solo tiene valor para el tipo de movimiento al que corresponde.

   SIN CHECK que ate el tipo a la columna (algo como "si es PAGO_CON_TARJETA
   entonces tarjeta_id NOT NULL") a proposito: ese CHECK tendria que nombrar el
   id 4 del catalogo, y quedaria desactualizado en silencio si alguien reordena
   Tipo_Movimiento. La coherencia la garantiza el servicio, que es el unico que
   inserta pagos.
   ============================================================================ */
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID(N'dbo.Movimientos') AND name = N'tarjeta_id')
BEGIN
    ALTER TABLE dbo.Movimientos
        ADD tarjeta_id INT NULL;

    PRINT 'Columna Movimientos.tarjeta_id agregada.';
END
ELSE
    PRINT 'Columna Movimientos.tarjeta_id ya existia: sin cambios.';
GO

/* La FK va en su propio lote: ALTER TABLE ADD y la FK sobre esa misma columna no
   pueden ir en el mismo batch, porque el parser no ve todavia la columna nueva. */
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Movimientos_Tarjetas')
BEGIN
    ALTER TABLE dbo.Movimientos
        ADD CONSTRAINT FK_Movimientos_Tarjetas
            FOREIGN KEY (tarjeta_id) REFERENCES dbo.Tarjetas (id);

    PRINT 'FK_Movimientos_Tarjetas creada.';
END
ELSE
    PRINT 'FK_Movimientos_Tarjetas ya existia: sin cambios.';
GO


/* ============================================================================
   3. Tipo_Movimiento: PAGO_CON_TARJETA
   Tipo_Movimiento no tiene IDENTITY a proposito (ver Create(v.002)): los ids se
   insertan explicitos para que sean iguales en todas las maquinas del squad.
   Por eso el id 4 se escribe a mano y no se deja sortear.

   El texto tiene que coincidir EXACTO con SignoDeMovimiento.TipoPagoConTarjeta:
   el servicio busca el tipo por descripcion, no por id.
   ============================================================================ */
IF NOT EXISTS (SELECT 1 FROM dbo.Tipo_Movimiento WHERE descripcion = N'PAGO_CON_TARJETA')
BEGIN
    INSERT INTO dbo.Tipo_Movimiento (id, descripcion) VALUES (4, N'PAGO_CON_TARJETA');
    PRINT 'Tipo de movimiento PAGO_CON_TARJETA agregado con id 4.';
END
ELSE
    PRINT 'Tipo de movimiento PAGO_CON_TARJETA ya existia: sin cambios.';
GO

/* El otro lado del pago: lo que ve el comercio que cobra.
   Son DOS tipos y no uno por el mismo motivo que TRANSFERENCIA_ENVIADA y
   TRANSFERENCIA_RECIBIDA estan separadas (ver Create(v.002)): asi se sabe si el
   movimiento suma o resta sin agregar una columna de signo y sin cruzar tablas
   en cada fila del historial. */
IF NOT EXISTS (SELECT 1 FROM dbo.Tipo_Movimiento WHERE descripcion = N'PAGO_RECIBIDO')
BEGIN
    INSERT INTO dbo.Tipo_Movimiento (id, descripcion) VALUES (5, N'PAGO_RECIBIDO');
    PRINT 'Tipo de movimiento PAGO_RECIBIDO agregado con id 5.';
END
ELSE
    PRINT 'Tipo de movimiento PAGO_RECIBIDO ya existia: sin cambios.';
GO
