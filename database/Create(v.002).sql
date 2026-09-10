/* ============================================================================
   DigitalArs - Billetera Virtual
   Script Create (v.002): Tablas, restricciones e indices
   Requiere: Init(v.001).sql  

   ALCANCE DE ESTA VERSION
   Solo los cambios necesarios para:
     (a) que el scaffolding de EF Core genere codigo usable  -> HU-003
     (b) que el modelo pueda convivir con ASP.NET Core Identity
     (c) cumplir los criterios de aceptacion de HU-002

   Cambios estructurales respecto de v.001: DOS.
     1. Columna nueva transferencia_id  en movimientos para tabla de trasnferencias futura .
     2. Movimientos.segunda_cuenta se reemplaza por transferencia_id (FK).

   Todo lo demas son renombres, tipos de dato, DEFAULT, CHECK y nombres de
   constraint: no modifican el diagrama ER.

   ============================================================================ */

USE DigitalArs;  
GO

/* Orden inverso a las dependencias de FK. */
DROP TABLE IF EXISTS dbo.Movimientos;
DROP TABLE IF EXISTS dbo.Transferencias;
DROP TABLE IF EXISTS dbo.Cuentas;
DROP TABLE IF EXISTS dbo.Tipo_Movimiento;
DROP TABLE IF EXISTS dbo.Usuarios;
GO


/* ============================================================================
   Usuarios
   ============================================================================ */
CREATE TABLE dbo.Usuarios
(
    id                INT             NOT NULL IDENTITY(1,1),

    /* [IDENTITY] Vinculo 1:1 con AspNetUsers.Id. NVARCHAR(450) porque ese es el
       tipo de la PK de Identity. Nullable: en el registro se inserta primero el
       usuario de Identity y despues se completa este campo.
       Sin FK a proposito: AspNetUsers la crean las migraciones de EF y no
       existe cuando corre este script; si existiera, el scaffold generaria una
       entidad AspNetUser duplicada. */
    identity_user_id  NVARCHAR(450)   NULL,

    nombre            VARCHAR(100)    NOT NULL,
    apellido          VARCHAR(100)    NOT NULL,
    tipo_documento    NVARCHAR(20)    NOT NULL,
    nro_documento     NVARCHAR(20)    NOT NULL,
    email             NVARCHAR(256)   NOT NULL,
    is_active         BIT             NOT NULL CONSTRAINT DF_Usuarios_IsActive DEFAULT (1),

    CONSTRAINT PK_Usuarios PRIMARY KEY CLUSTERED (id),

    /* [HU-002] Unicidad de la COMBINACION (tipo, numero). */
    CONSTRAINT UQ_Usuarios_Documento UNIQUE (tipo_documento, nro_documento),
    CONSTRAINT UQ_Usuarios_Email     UNIQUE (email),
    CONSTRAINT CK_Usuarios_TipoDocumento CHECK (tipo_documento IN (N'DNI', N'PASAPORTE'))
);
GO



/* ============================================================================
   Cuentas
   ============================================================================ */
CREATE TABLE dbo.Cuentas
(
    id           INT             NOT NULL IDENTITY(1,1),
    usuario_id   INT             NOT NULL,
    alias        VARCHAR(50)     NOT NULL,
    cvu          VARCHAR(22)     NOT NULL,
    saldo        DECIMAL(18,2)   NOT NULL CONSTRAINT DF_Cuentas_Saldo DEFAULT (0),

    CONSTRAINT PK_Cuentas PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_Cuentas_Usuarios FOREIGN KEY (usuario_id) REFERENCES dbo.Usuarios (id),
    CONSTRAINT UQ_Cuentas_UsuarioId UNIQUE (usuario_id),
    CONSTRAINT UQ_Cuentas_Alias UNIQUE (alias),
    CONSTRAINT UQ_Cuentas_Cvu   UNIQUE (cvu),
    CONSTRAINT CK_Cuentas_Saldo CHECK (saldo >= 0)
);
GO


/* ============================================================================
   Tipo_Movimiento
   Catalogo. SIN IDENTITY: los ids se insertan explicitos porque el CHECK de
   coherencia de Movimientos y la API los referencian por numero. Con IDENTITY
   podrian diferir entre maquinas del squad.

   Tres tipos y no dos: separar ENVIADA de RECIBIDA es lo que permite saber si
   un movimiento suma o resta sin agregar una columna "signo" y sin hacer un
   JOIN contra Transferencias en cada fila del historial. Es tambien la etiqueta
   que React muestra directo.
   ============================================================================ */
CREATE TABLE dbo.Tipo_Movimiento
(
    id           INT            NOT NULL,
    descripcion  NVARCHAR(50)   NOT NULL,

    CONSTRAINT PK_Tipo_Movimiento PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_Tipo_Movimiento_Descripcion UNIQUE (descripcion)
);
GO

/* Sin 'Retiro': el MVP no tiene retiros. Si se implementa el bonus de plazo
   fijo, se agregan los tipos que haga falta con ids nuevos. */
INSERT INTO dbo.Tipo_Movimiento (id, descripcion) VALUES
    (1, N'DEPOSITO'),
    (2, N'TRANSFERENCIA_ENVIADA'),
    (3, N'TRANSFERENCIA_RECIBIDA');
GO




/* ============================================================================
   Movimientos
   Append-only: no se hace UPDATE ni DELETE. Un movimiento equivocado se
   corrige con un movimiento inverso.

   Cambios respecto de v.001:
   - id_movimiento (que era el FK al tipo, con nombre enganoso) -> tipo_movimiento_id
   - id_cuenta -> cuenta_id
   - se elimina tipo_mov: duplicaba Tipo_Movimiento.descripcion y nada impedia
     que dijeran cosas distintas
   - segunda_cuenta (CVU en texto, NOT NULL) -> transferencia_id (FK, nullable)
   - fecha_mov DATE -> fecha DATETIME2(3): con DATE no se pueden ordenar dos
     movimientos del mismo dia y la paginacion del historial repite o saltea
   ============================================================================ */
CREATE TABLE dbo.Movimientos
(
    id                  INT             NOT NULL IDENTITY(1,1),
    cuenta_id           INT             NOT NULL,
    tipo_movimiento_id  INT             NOT NULL,
    importe             DECIMAL(18,2)   NOT NULL,
    fecha               DATETIME2(3)    NOT NULL ,
    
    /*PARA IMPLEMENTAR TABLA TRANSFERENCIAS */
    transferencia_id    INT             NULL,

    CONSTRAINT PK_Movimientos PRIMARY KEY CLUSTERED (id),

    CONSTRAINT FK_Movimientos_Cuentas
        FOREIGN KEY (cuenta_id)          REFERENCES dbo.Cuentas (id),
    CONSTRAINT FK_Movimientos_Tipo_Movimiento
        FOREIGN KEY (tipo_movimiento_id) REFERENCES dbo.Tipo_Movimiento (id),
    

    CONSTRAINT CK_Movimientos_Importe CHECK (importe > 0),

);
GO

