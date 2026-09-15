/* ============================================================================
   DigitalArs - Billetera Virtual
   Script Seed (v.003): datos iniciales
   Requiere: Create(v.002).sql y Identity(v.001).sql

   Deja la aplicacion usable desde el primer arranque:
     1. Roles Administrador y Usuario.
     2. Administrador inicial, con su perfil de negocio.
     3. Usuarios de ejemplo para probar consultas (no pueden iniciar sesion).

   Se puede repetir: cada bloque solo inserta lo que falta.

   Credenciales del administrador: admin@digitalars.com / Admin123!
   Son de proyecto de estudio y estan versionadas a proposito. No usar esta
   contrasena fuera del entorno local.
   ============================================================================ */

USE DigitalArs;
GO

/* AspNetRoles y AspNetUsers tienen indices filtrados, y SQL Server rechaza cualquier
   INSERT sobre ellas si estas dos opciones no estan activas. SSMS las activa por su
   cuenta, sqlcmd no: se declaran aca para que el script corra en cualquier cliente. */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @AdminEmail NVARCHAR(256) = N'admin@digitalars.com';

/* Identity guarda la contrasena con PBKDF2 y salt aleatorio, que no se puede
   calcular en T-SQL. Este hash se genero una vez con PasswordHasher y
   corresponde a 'Admin123!'. Para cambiar la contrasena hay que regenerarlo. */
DECLARE @AdminHash NVARCHAR(MAX) =
    N'AQAAAAIAAYagAAAAEBVv+CVu4EjWqDqbOmC8FEx1w2e25tRXvQX/Y6kuIbf/PFYXqyJ6kySH/izh8PGHuQ==';

BEGIN TRANSACTION;

/* ----------------------------------------------------------------------------
   Roles
   Identity busca los roles por NormalizedName, siempre en mayusculas.
   ---------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.AspNetRoles WHERE NormalizedName = N'ADMINISTRADOR')
    INSERT INTO dbo.AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (CONVERT(NVARCHAR(450), NEWID()), N'Administrador', N'ADMINISTRADOR',
            CONVERT(NVARCHAR(MAX), NEWID()));

IF NOT EXISTS (SELECT 1 FROM dbo.AspNetRoles WHERE NormalizedName = N'USUARIO')
    INSERT INTO dbo.AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (CONVERT(NVARCHAR(450), NEWID()), N'Usuario', N'USUARIO',
            CONVERT(NVARCHAR(MAX), NEWID()));


/* ----------------------------------------------------------------------------
   Administrador en Identity

   SecurityStamp y ConcurrencyStamp no pueden quedar en NULL: el backend lee el
   primero para armar el token y SQL Server usa el segundo como control de
   concurrencia al actualizar el usuario.
   ---------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.AspNetUsers WHERE NormalizedEmail = UPPER(@AdminEmail))
    INSERT INTO dbo.AspNetUsers
        (Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed,
         PasswordHash, SecurityStamp, ConcurrencyStamp,
         PhoneNumber, PhoneNumberConfirmed, TwoFactorEnabled,
         LockoutEnd, LockoutEnabled, AccessFailedCount)
    VALUES
        (CONVERT(NVARCHAR(450), NEWID()), @AdminEmail, UPPER(@AdminEmail),
         @AdminEmail, UPPER(@AdminEmail), 1,
         @AdminHash, CONVERT(NVARCHAR(MAX), NEWID()), CONVERT(NVARCHAR(MAX), NEWID()),
         NULL, 0, 0, NULL, 1, 0);

DECLARE @AdminId    NVARCHAR(450) = (SELECT Id FROM dbo.AspNetUsers WHERE NormalizedEmail = UPPER(@AdminEmail));
DECLARE @RolAdminId NVARCHAR(450) = (SELECT Id FROM dbo.AspNetRoles WHERE NormalizedName = N'ADMINISTRADOR');

IF NOT EXISTS (SELECT 1 FROM dbo.AspNetUserRoles WHERE UserId = @AdminId AND RoleId = @RolAdminId)
    INSERT INTO dbo.AspNetUserRoles (UserId, RoleId)
    VALUES (@AdminId, @RolAdminId);


/* ----------------------------------------------------------------------------
   Perfil de negocio del administrador

   identity_user_id enlaza esta fila con AspNetUsers: sin ese vinculo el backend
   rechaza el token aunque la contrasena sea correcta.
   El administrador no opera la billetera, asi que no lleva cuenta en pesos.
   ---------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE email = @AdminEmail)
    INSERT INTO dbo.Usuarios (identity_user_id, nombre, apellido, tipo_documento,
                              nro_documento, email, is_active)
    VALUES (@AdminId, N'Admin', N'DigitalArs', N'DNI', N'00000001', @AdminEmail, 1);


/* ----------------------------------------------------------------------------
   Usuarios de ejemplo

   Quedan con identity_user_id = NULL: sirven para probar consultas y
   restricciones, no para iniciar sesion.
   ---------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE email = N'juan.perez@mail.com')
    INSERT INTO dbo.Usuarios (nombre, apellido, tipo_documento, nro_documento, email, is_active)
    VALUES
        ('Juan',   N'Pérez', N'DNI',       N'12345678', N'juan.perez@mail.com',   1),
        (N'María', N'Gómez', N'DNI',       N'87654321', N'maria.gomez@mail.com',  1),
        ('Carlos', N'López', N'PASAPORTE', N'AB123456', N'carlos.lopez@mail.com', 0);

/* Los ids son IDENTITY: no se asumen, se resuelven por email (que es UNIQUE). */
DECLARE @UsuarioJuan   INT = (SELECT id FROM dbo.Usuarios WHERE email = N'juan.perez@mail.com');
DECLARE @UsuarioMaria  INT = (SELECT id FROM dbo.Usuarios WHERE email = N'maria.gomez@mail.com');
DECLARE @UsuarioCarlos INT = (SELECT id FROM dbo.Usuarios WHERE email = N'carlos.lopez@mail.com');


/* ----------------------------------------------------------------------------
   Cuentas de los usuarios de ejemplo
   ---------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Cuentas WHERE alias = 'juan.cuenta')
    INSERT INTO dbo.Cuentas (usuario_id, alias, cvu, saldo)
    VALUES
        (@UsuarioJuan,   'juan.cuenta',   '0000000000000000000001',  3500.00),
        (@UsuarioMaria,  'maria.cuenta',  '0000000000000000000002', 26500.00),
        (@UsuarioCarlos, 'carlos.cuenta', '0000000000000000000003',   300.00);

DECLARE @CuentaJuan   INT = (SELECT id FROM dbo.Cuentas WHERE alias = 'juan.cuenta');
DECLARE @CuentaMaria  INT = (SELECT id FROM dbo.Cuentas WHERE alias = 'maria.cuenta');
DECLARE @CuentaCarlos INT = (SELECT id FROM dbo.Cuentas WHERE alias = 'carlos.cuenta');


/* ----------------------------------------------------------------------------
   Depositos: tipo 1, sin transferencia_id.

   La columna fecha guarda SIEMPRE UTC: el backend escribe DateTime.UtcNow y la
   API la devuelve convertida a -03:00. Por eso estos literales estan en UTC y
   son tres horas mas que la hora argentina que se ve en pantalla: 13:00 UTC se
   muestra como las 10:00 del 1 de septiembre.
   ---------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Movimientos WHERE cuenta_id = @CuentaJuan)
    INSERT INTO dbo.Movimientos (cuenta_id, tipo_movimiento_id, transferencia_id, importe, fecha)
    VALUES
        (@CuentaJuan,   1, NULL,  5000.00, '2026-09-01T13:00:00'),
        (@CuentaMaria,  1, NULL, 25000.00, '2026-09-02T14:30:00'),
        (@CuentaCarlos, 1, NULL,   300.00, '2026-09-04T12:15:00');


COMMIT TRANSACTION;

GO
