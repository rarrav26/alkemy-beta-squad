DROP TABLE IF EXISTS Movimientos;
DROP TABLE IF EXISTS Cuentas;
DROP TABLE IF EXISTS Tipo_Movimiento;
DROP TABLE IF EXISTS Usuarios;





CREATE TABLE Usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    tipo_documento NVARCHAR(20) NOT NULL,
    nro_documento NVARCHAR(20) NOT NULL UNIQUE,
    email NVARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT UQ_documento UNIQUE (tipo_documento, nro_documento),
    is_active BIT
);

CREATE TABLE Cuentas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    alias VARCHAR(50) NOT NULL UNIQUE,
    cvu VARCHAR(22) NOT NULL UNIQUE,
    saldo DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

CREATE TABLE Tipo_Movimiento(
    id INT IDENTITY(1,1) PRIMARY KEY,
    descripcion NVARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Movimientos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_cuenta INT NOT NULL,
    id_movimiento INT NOT NULL,
    fecha_mov DATE NOT NULL,
    monto DECIMAL(18,2) NOT NULL,
    tipo_mov VARCHAR(20) NOT NULL,
    segunda_cuenta VARCHAR(22) NOT NULL,
    FOREIGN KEY (id_cuenta) REFERENCES Cuentas(id),
    FOREIGN KEY (id_movimiento) REFERENCES Tipo_Movimiento(id)
);


