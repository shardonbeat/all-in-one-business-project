const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(path.join(__dirname, '..', 'database.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

const schema = [
  {
    name: 'Roles',
    sql: `CREATE TABLE IF NOT EXISTS Roles (
      id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_rol VARCHAR(30) NOT NULL UNIQUE
    )`
  },
  {
    name: 'Usuarios',
    sql: `CREATE TABLE IF NOT EXISTS Usuarios (
      id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      id_rol INTEGER NOT NULL,
      FOREIGN KEY (id_rol) REFERENCES Roles (id_rol)
        ON UPDATE CASCADE ON DELETE RESTRICT
    )`
  },
  {
    name: 'Clientes',
    sql: `CREATE TABLE IF NOT EXISTS Clientes (
      id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
      rif_cedula VARCHAR(20) NOT NULL UNIQUE,
      nombre VARCHAR(100) NOT NULL,
      direccion VARCHAR(200)
    )`
  },
  {
    name: 'Proveedores',
    sql: `CREATE TABLE IF NOT EXISTS Proveedores (
      id_proveedor INTEGER PRIMARY KEY AUTOINCREMENT,
      rif VARCHAR(20) NOT NULL UNIQUE,
      razon_social VARCHAR(100) NOT NULL,
      direccion VARCHAR(200),
      telefono VARCHAR(20)
    )`
  },
  {
    name: 'Productos',
    sql: `CREATE TABLE IF NOT EXISTS Productos (
      sku VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      marca VARCHAR(50),
      tipo_vehiculo VARCHAR(50),
      stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
      precio_costo DECIMAL(10, 2) NOT NULL CHECK (precio_costo >= 0),
      precio_venta DECIMAL(10, 2) NOT NULL CHECK (precio_venta >= 0),
      stock_maximo INTEGER NOT NULL CHECK (stock_maximo >= 0),
      stock_minimo INTEGER NOT NULL DEFAULT 0
        CHECK (stock_minimo >= 0 AND stock_minimo <= stock_maximo)
    )`
  },
  {
    name: 'Compras',
    sql: `CREATE TABLE IF NOT EXISTS Compras (
      id_compra INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      id_proveedor INTEGER NOT NULL,
      id_usuario INTEGER NOT NULL,
      FOREIGN KEY (id_proveedor) REFERENCES Proveedores (id_proveedor)
        ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (id_usuario) REFERENCES Usuarios (id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT
    )`
  },
  {
    name: 'Detalles_Compra',
    sql: `CREATE TABLE IF NOT EXISTS Detalles_Compra (
      id_detalle_c INTEGER PRIMARY KEY AUTOINCREMENT,
      id_compra INTEGER NOT NULL,
      sku VARCHAR(50) NOT NULL,
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      costo_unitario DECIMAL(10, 2) NOT NULL CHECK (costo_unitario >= 0),
      FOREIGN KEY (id_compra) REFERENCES Compras (id_compra)
        ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (sku) REFERENCES Productos (sku)
        ON UPDATE CASCADE ON DELETE RESTRICT
    )`
  },
  {
    name: 'Ventas',
    sql: `CREATE TABLE IF NOT EXISTS Ventas (
      id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      metodo_pago VARCHAR(30) NOT NULL,
      id_cliente INTEGER NOT NULL,
      id_usuario INTEGER NOT NULL,
      FOREIGN KEY (id_cliente) REFERENCES Clientes (id_cliente)
        ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (id_usuario) REFERENCES Usuarios (id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT
    )`
  },
  {
    name: 'Detalles_Venta',
    sql: `CREATE TABLE IF NOT EXISTS Detalles_Venta (
      id_detalle_v INTEGER PRIMARY KEY AUTOINCREMENT,
      id_venta INTEGER NOT NULL,
      sku VARCHAR(50) NOT NULL,
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      precio_aplicado DECIMAL(10, 2) NOT NULL CHECK (precio_aplicado >= 0),
      FOREIGN KEY (id_venta) REFERENCES Ventas (id_venta)
        ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (sku) REFERENCES Productos (sku)
        ON UPDATE CASCADE ON DELETE RESTRICT
    )`
  }
];

const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_compras_proveedor ON Compras (id_proveedor)',
  'CREATE INDEX IF NOT EXISTS idx_compras_usuario ON Compras (id_usuario)',
  'CREATE INDEX IF NOT EXISTS idx_detalles_compra_compra ON Detalles_Compra (id_compra)',
  'CREATE INDEX IF NOT EXISTS idx_detalles_compra_sku ON Detalles_Compra (sku)',
  'CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON Ventas (id_cliente)',
  'CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON Ventas (id_usuario)',
  'CREATE INDEX IF NOT EXISTS idx_detalles_venta_venta ON Detalles_Venta (id_venta)',
  'CREATE INDEX IF NOT EXISTS idx_detalles_venta_sku ON Detalles_Venta (sku)'
];

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) console.error('Error enabling foreign keys:', err.message);
  });

  schema.forEach(({ name, sql }) => {
    db.run(sql, (err) => {
      if (err) console.error(`Error creating ${name} table:`, err.message);
    });
  });

  indexes.forEach((sql) => {
    db.run(sql, (err) => {
      if (err) console.error('Error creating database index:', err.message);
    });
  });
});

module.exports = db;