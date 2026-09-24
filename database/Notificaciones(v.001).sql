/* ============================================================================
   DigitalArs - Billetera Virtual
   Script Notificaciones (v.001): avisos de actividad de la cuenta
   Requiere: Create(v.002).sql

   Se puede repetir: si la tabla ya existe, no hace nada.
   Correr en cualquier momento despues de Create(v.002).sql.

   POR QUE UN SCRIPT APARTE Y NO UN Create(v.003)
   Los scripts Create arrancan con DROP TABLE de las cinco tablas del modelo, asi
   que correr uno nuevo borraria los usuarios, las cuentas y los movimientos que
   ya estan cargados. Este script solo agrega, no toca nada de lo existente.

   POR QUE UNA TABLA Y NO UNA COLUMNA EN Movimientos
   Movimientos es append-only: no se le hace UPDATE ni DELETE. Marcar un aviso
   como leido es justamente un UPDATE, asi que no puede vivir ahi.
   ============================================================================ */

USE DigitalArs;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO


/* ============================================================================
   Notificaciones
   Un aviso para un usuario, originado por un movimiento de su cuenta.

   Se generan tres por operacion confirmada:
     - DEPOSITO                -> un aviso para quien deposito
     - TRANSFERENCIA_ENVIADA   -> un aviso para quien envio
     - TRANSFERENCIA_RECIBIDA  -> un aviso para quien recibio

   El INSERT va DENTRO de la misma transaccion que el movimiento: si la
   operacion se revierte, el aviso se revierte con ella y nadie ve dinero que
   no llego.
   ============================================================================ */
IF OBJECT_ID(N'dbo.Notificaciones', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notificaciones
    (
        id             INT             NOT NULL IDENTITY(1,1),

        /* A quien se le avisa. Apunta a Usuarios y no a AspNetUsers porque el
           dominio vive en Usuarios, igual que Cuentas y Movimientos. */
        usuario_id     INT             NOT NULL,

        /* El movimiento que origino el aviso. Da trazabilidad y de aca sale el
           tipo (deposito / enviada / recibida) sin repetirlo en otra columna.
           NOT NULL: hoy todo aviso nace de un movimiento. */
        movimiento_id  INT             NOT NULL,

        /* Texto ya armado para mostrar. Se guarda resuelto y no se recalcula al
           leerlo: el aviso tiene que decir lo mismo dentro de seis meses, aunque
           el titular de la otra cuenta se haya cambiado el nombre. */
        titulo         NVARCHAR(100)   NOT NULL,
        mensaje        NVARCHAR(300)   NOT NULL,

        leida          BIT             NOT NULL CONSTRAINT DF_Notificaciones_Leida DEFAULT (0),

        /* En UTC, igual que Movimientos.fecha: la API escribe DateTime.UtcNow y
           devuelve la fecha en hora argentina al responder. */
        fecha          DATETIME2(3)    NOT NULL,

        CONSTRAINT PK_Notificaciones PRIMARY KEY CLUSTERED (id),

        CONSTRAINT FK_Notificaciones_Usuarios
            FOREIGN KEY (usuario_id)    REFERENCES dbo.Usuarios (id),
        CONSTRAINT FK_Notificaciones_Movimientos
            FOREIGN KEY (movimiento_id) REFERENCES dbo.Movimientos (id)
    );

    /* Cubre las dos consultas del panel sin tocar la tabla:
         - el listado del usuario ordenado por fecha descendente,
         - el conteo de no leidas para el globito (leida entra con INCLUDE, asi
           el indice alcanza para contar y no hay que ir a buscar la fila). */
    CREATE INDEX IX_Notificaciones_Usuario_Fecha
        ON dbo.Notificaciones (usuario_id, fecha DESC)
        INCLUDE (leida);
END;
GO
