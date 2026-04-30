const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

const dbPath = path.join(app.getPath('userData'), 'consentimientos.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipoDocumento TEXT,
    numeroDocumento TEXT UNIQUE,
    lugarExpedicion TEXT
  );

  CREATE TABLE IF NOT EXISTS medicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    cedula TEXT UNIQUE,
    registromedico TEXT UNIQUE,
    firma TEXT
  );

  CREATE TABLE IF NOT EXISTS enfermeros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    documentoenfermero TEXT UNIQUE,
    firma TEXT
  );

  CREATE TABLE IF NOT EXISTS grupos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS plantillas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    grupo TEXT,
    codigo TEXT,
    version TEXT,
    fecha TEXT,
    contenido TEXT
  );

  CREATE TABLE IF NOT EXISTS consentimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pacienteId INTEGER,
    medicoId INTEGER,
    enfermeroId INTEGER,
    plantillaId INTEGER,
    fecha TEXT,
    firmaPaciente TEXT,
    esMenor INTEGER DEFAULT 0,
    acudienteNombre TEXT,
    acudienteDocumento TEXT,
    acudienteParentesco TEXT,
    firmaAcudiente TEXT,
    FOREIGN KEY (pacienteId) REFERENCES pacientes(id),
    FOREIGN KEY (medicoId) REFERENCES medicos(id),
    FOREIGN KEY (enfermeroId) REFERENCES enfermeros(id),
    FOREIGN KEY (plantillaId) REFERENCES plantillas(id)
  );

  CREATE TABLE IF NOT EXISTS historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    accion TEXT NOT NULL,
    detalle TEXT,
    fecha TEXT NOT NULL
  );
`);

// Migración segura: agregar columnas nuevas a bases de datos ya existentes
const columnasActuales = db.pragma('table_info(consentimientos)').map(c => c.name);
const columnasFaltantes = [
  { nombre: 'esMenor',              definicion: 'INTEGER DEFAULT 0' },
  { nombre: 'acudienteNombre',      definicion: 'TEXT' },
  { nombre: 'acudienteDocumento',   definicion: 'TEXT' },
  { nombre: 'acudienteParentesco',  definicion: 'TEXT' },
  { nombre: 'firmaAcudiente',       definicion: 'TEXT' },
];

for (const col of columnasFaltantes) {
  if (!columnasActuales.includes(col.nombre)) {
    db.exec(`ALTER TABLE consentimientos ADD COLUMN ${col.nombre} ${col.definicion}`);
    console.log(`Columna agregada: ${col.nombre}`);
  }
}

module.exports = db;