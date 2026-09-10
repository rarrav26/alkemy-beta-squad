-- Usuarios
INSERT INTO Usuarios (nombre, apellido, tipo_documento, nro_documento, email, is_active)
VALUES 
('Juan', 'Pérez', 'DNI', '12345678', 'juan.perez@mail.com', 1),
('María', 'Gómez', 'DNI', '87654321', 'maria.gomez@mail.com', 1),
('Carlos', 'López', 'Pasaporte', 'AB123456', 'carlos.lopez@mail.com', 0);

-- Cuentas
INSERT INTO Cuentas (id_usuario, alias, cvu, saldo)
VALUES
(1, 'juan.cuenta', '0000000000000000000001', 15000.50),
(2, 'maria.cuenta', '0000000000000000000002', 25000.00),
(3, 'carlos.cuenta', '0000000000000000000003', 500.75);

-- Tipos de movimiento
INSERT INTO Tipo_Movimiento (descripcion)
VALUES
('Depósito'),
('Retiro'),
('Transferencia');

-- Movimientos
INSERT INTO Movimientos (id_cuenta, id_movimiento, fecha_mov, monto, tipo_mov, segunda_cuenta)
VALUES
(1, 1, '2026-09-01', 5000.00, 'Depósito', '0000000000000000000001'),
(2, 2, '2026-09-02', 2000.00, 'Retiro', '0000000000000000000002'),
(1, 3, '2026-09-03', 1500.00, 'Transferencia', '0000000000000000000002'),
(3, 1, '2026-09-04', 300.00, 'Depósito', '0000000000000000000003');
