/* ============================================================================
   DigitalArs - Billetera Virtual
   Script Seed (v.002): Datos de prueba - SOLO DESARROLLO
   Requiere: Create(v.002).sql

   NO crea el administrador inicial. El admin es un usuario de Identity y se
   siembra desde el backend.

   Los usuarios de aca quedan con identity_user_id = NULL: sirven para probar
   consultas y restricciones, no para iniciar sesion.
   ============================================================================ */

USE DigitalArs;   
GO

SET NOCOUNT ON;


BEGIN TRANSACTION;

/* ----------------------------------------------------------------------------
   Usuarios
   ---------------------------------------------------------------------------- */
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
   Cuentas
   ---------------------------------------------------------------------------- */
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
   ---------------------------------------------------------------------------- */
INSERT INTO dbo.Movimientos (cuenta_id, tipo_movimiento_id, transferencia_id, importe, fecha)
VALUES
    (@CuentaJuan,   1, NULL,  5000.00, '2026-09-01T10:00:00'),
    (@CuentaMaria,  1, NULL, 25000.00, '2026-09-02T11:30:00'),
    (@CuentaCarlos, 1, NULL,   300.00, '2026-09-04T09:15:00');


COMMIT TRANSACTION;

GO
