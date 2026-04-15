const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// app.getPath() es seguro aquí porque database.js se importa
// DENTRO de app.whenReady() desde main.js
const dbPath = path.join(app.getPath('userData'), 'consentimientos.db');
const db = new Database(dbPath);

// Activar claves foráneas (SQLite las desactiva por defecto)
db.pragma('foreign_keys = ON');

// Crear tablas si no existen
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
    FOREIGN KEY (pacienteId) REFERENCES pacientes(id),
    FOREIGN KEY (medicoId) REFERENCES medicos(id),
    FOREIGN KEY (enfermeroId) REFERENCES enfermeros(id),
    FOREIGN KEY (plantillaId) REFERENCES plantillas(id)
  );
`);

module.exports = db;