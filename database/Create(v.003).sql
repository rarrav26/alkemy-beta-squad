/* ============================================================================
   DigitalArs - Billetera Virtual
   Script Create (v.003): Tarjetas virtuales
   Requiere: Create(v.002).sql

   ALCANCE DE ESTA VERSION
   Agrega una sola tabla, dbo.Tarjetas, para las HU de tarjeta virtual:
     (a) generar una tarjeta asociada a la cuenta
     (b) congelar y descongelar temporalmente
     (c) dar de baja de forma permanente (baja logica)

   *** ESTE SCRIPT ES ADITIVO: NO TIENE NINGUN DROP ***
   A diferencia de Create(v.002).sql, que borra y recrea todas las tablas, este
   se puede correr sobre una base con datos de prueba sin perder nada. Tampoco
   hace falta volver a correr los Seed.

   Es idempotente: si la tabla o el indice ya existen, los saltea e informa por
   consola en lugar de fallar. Se puede correr dos veces sin consecuencias.
   ============================================================================ */

USE DigitalArs;
GO

/* Obligatorio para el indice filtrado del final: SQL Server rechaza crear uno
   si QUOTED_IDENTIFIER esta en OFF. SSMS lo pone en ON solo, pero sqlcmd lo
   deja en OFF, asi que se fija aca y el script anda igual desde cualquier
   cliente. */
SET QUOTED_IDENTIFIER ON;
GO


/* ============================================================================
   Tarjetas

   Tabla nueva y no una columna en Cuentas: una cuenta tiene a lo largo del
   tiempo VARIAS tarjetas (se da de baja una y se genera otra), y la baja es
   logica, o sea que el registro viejo se conserva. Eso es una relacion 1:N y no
   entra en una fila de Cuentas.
   "El usuario tiene tarjeta?" se responde con "existe una fila vigente".

   ESTADOS
   Tres estados mutuamente excluyentes, en una sola columna de texto:

       ACTIVA  <-->  CONGELADA  -->  DADA_DE_BAJA   (terminal)

   - ACTIVA       opera con normalidad y su codigo se puede revelar
   - CONGELADA    bloqueo temporal y reversible; NO permite revelar el codigo
   - DADA_DE_BAJA terminal: no se reactiva ni se descongela nunca mas

   Por que una columna de texto y no un BIT: con un bit solo se pueden
   representar dos estados. Con dos bits (is_active + is_congelada) aparecen
   combinaciones imposibles como "dada de baja y congelada a la vez", que habria
   que prohibir aparte. Una sola columna los vuelve excluyentes por
   construccion.
   Texto y no un TINYINT con catalogo: en este proyecto la base se inspecciona a
   mano seguido, y leer 'CONGELADA' en un SELECT es mejor que leer un 2 y tener
   que ir a buscar que significa. Son tres valores fijos que no cambian, asi que
   un CHECK alcanza y no justifica una tabla de catalogo como Tipo_Movimiento.
   ============================================================================ */
IF OBJECT_ID('dbo.Tarjetas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tarjetas
    (
        id           INT             NOT NULL IDENTITY(1,1),
        cuenta_id    INT             NOT NULL,

        /* 16 digitos, sin espacios ni guiones: el formateo visual
           (4000 1234 5678 9012) es cosa del front. Se guarda completo porque
           el usuario tiene derecho a verlo, y enmascararlo es tarea de la API:
           el GET devuelve solo los ultimos 4 y el numero entero sale
           unicamente por el endpoint de revelado, previa contrasena. */
        numero       VARCHAR(16)     NOT NULL,

        /* DATE y no texto 'MM/AA': asi se puede comparar si la tarjeta vencio
           con una consulta, en lugar de parsear una cadena. El front la muestra
           como MM/AA. Se guarda el ultimo dia del mes de vencimiento, que es
           hasta cuando la tarjeta es valida. */
        vencimiento  DATE            NOT NULL,

        /* [DECISION DEL EQUIPO] Codigo de seguridad en TEXTO PLANO.
           Es un dato SIMULADO: estas tarjetas no existen en ninguna red de
           pagos y no sirven para operar en ningun comercio real.
           En un sistema de pagos real esto seria una infraccion grave: la norma
           PCI-DSS prohibe almacenar el codigo de seguridad, incluso cifrado,
           incluso por un rato. Si este proyecto llegara a procesar tarjetas
           reales, esta columna tiene que desaparecer y el codigo se deriva o no
           se guarda. Queda documentado a proposito para que la decision sea
           visible y no se herede por descuido. */
        cvv          CHAR(3)         NOT NULL,

        estado       VARCHAR(20)     NOT NULL CONSTRAINT DF_Tarjetas_Estado DEFAULT ('ACTIVA'),

        /* UTC, igual que Movimientos.fecha, que la API llena con DateTime.UtcNow.
           El DEFAULT esta por defensa: si alguien inserta a mano desde SSMS, la
           fila queda con fecha valida en lugar de fallar. */
        fecha_alta   DATETIME2(3)    NOT NULL CONSTRAINT DF_Tarjetas_FechaAlta DEFAULT (SYSUTCDATETIME()),

        /* Solo se completa al dar de baja. El CHECK de mas abajo la mantiene
           coherente con el estado. */
        fecha_baja   DATETIME2(3)    NULL,

        CONSTRAINT PK_Tarjetas PRIMARY KEY CLUSTERED (id),

        CONSTRAINT FK_Tarjetas_Cuentas
            FOREIGN KEY (cuenta_id) REFERENCES dbo.Cuentas (id),

        /* Unico sobre TODO el historial, incluidas las tarjetas dadas de baja:
           un numero no se reutiliza nunca. Es lo que obliga a que la generacion
           sea aleatoria con reintento y no derivada de la cuenta (un numero
           derivado de la cuenta chocaria con la tarjeta anterior al renovar). */
        CONSTRAINT UQ_Tarjetas_Numero UNIQUE (numero),

        CONSTRAINT CK_Tarjetas_Estado
            CHECK (estado IN ('ACTIVA', 'CONGELADA', 'DADA_DE_BAJA')),

        /* Solo digitos y exactamente 16. El patron [^0-9] es la forma de decir
           "algun caracter que no sea digito" en T-SQL. */
        CONSTRAINT CK_Tarjetas_Numero
            CHECK (numero NOT LIKE '%[^0-9]%' AND LEN(numero) = 16),

        CONSTRAINT CK_Tarjetas_Cvv
            CHECK (cvv NOT LIKE '%[^0-9]%'),

        /* Coherencia entre estado y fecha de baja: la fecha existe si y solo si
           la tarjeta esta dada de baja. Sin esto se pueden guardar filas que se
           contradicen (activa con fecha de baja, o dada de baja sin fecha). */
        CONSTRAINT CK_Tarjetas_Baja
            CHECK ((estado =  'DADA_DE_BAJA' AND fecha_baja IS NOT NULL)
                OR (estado <> 'DADA_DE_BAJA' AND fecha_baja IS NULL))
    );

    PRINT 'Tabla dbo.Tarjetas creada.';
END
ELSE
    PRINT 'Tabla dbo.Tarjetas ya existia: sin cambios.';
GO


/* ============================================================================
   UQ_Tarjetas_CuentaVigente
   "Una unica tarjeta activa por cuenta", garantizado por la base y no solo por
   el codigo. Es un indice UNICO FILTRADO: la unicidad se aplica unicamente a
   las filas que pasan el WHERE, asi que una cuenta puede tener muchas tarjetas
   dadas de baja pero solo una vigente.

   Por que el filtro incluye CONGELADA y no solo ACTIVA: una tarjeta congelada
   sigue siendo la tarjeta del usuario, no la perdio. Si liberara el lugar, el
   usuario podria congelar la suya, generar otra, y terminar con dos. Solo la
   baja definitiva libera el lugar, y eso es justamente lo que permite generar
   una tarjeta nueva despues de dar de baja la anterior.

   Consecuencia para el codigo: al renovar hay que poner la vieja en
   DADA_DE_BAJA ANTES de insertar la nueva, o este indice rechaza el INSERT.
   ============================================================================ */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UQ_Tarjetas_CuentaVigente'
                 AND object_id = OBJECT_ID('dbo.Tarjetas'))
BEGIN
    CREATE UNIQUE INDEX UQ_Tarjetas_CuentaVigente
        ON dbo.Tarjetas (cuenta_id)
        WHERE estado IN ('ACTIVA', 'CONGELADA');

    PRINT 'Indice UQ_Tarjetas_CuentaVigente creado.';
END
ELSE
    PRINT 'Indice UQ_Tarjetas_CuentaVigente ya existia: sin cambios.';
GO
