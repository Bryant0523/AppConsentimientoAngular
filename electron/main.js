const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const mammoth = require('mammoth');
const db = require('./database');
const fs = require('fs');



function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../build/LOGO.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env['NODE_ENV'] === 'development') {
    win.loadURL('http://localhost:4200');
  } else {
    win.loadFile(path.join(__dirname, '../dist/consentimientos-app/browser/index.html'));
  }
}




// ========================
// WORD
// ========================
ipcMain.handle('leer-word', async (_event, filePath) => {
  try {
    const resultado = await mammoth.convertToHtml({ path: filePath });
    return { success: true, html: resultado.value };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cargar-logo', (_event, rutaRelativa) => {
  try {
    const rutaAbsoluta = path.join(__dirname, '..', 'src', 'assets', rutaRelativa);
    const buffer = fs.readFileSync(rutaAbsoluta);
    return 'data:image/jpeg;base64,' + buffer.toString('base64');
  } catch (error) {
    console.error('Error cargando logo:', error);
    return null;
  }
});

ipcMain.handle('seleccionar-archivo', async () => {
  const resultado = await dialog.showOpenDialog({
    filters: [{ name: 'Word', extensions: ['docx'] }],
    properties: ['openFile'],
  });
  if (resultado.canceled) return null;
  return resultado.filePaths[0];
});

// ========================
// PACIENTES
// ========================
ipcMain.handle('pacientes:obtener', () => {
  try {
    const pacientes = db.prepare('SELECT * FROM pacientes').all();
    
    return pacientes;
  } catch (error) {
    console.error('Error al obtener pacientes:', error.message);
    return [];
  }
});

ipcMain.handle('pacientes:crear', (_event, paciente) => {
  try {
   
    const stmt = db.prepare(`
      INSERT INTO pacientes (nombre, tipoDocumento, numeroDocumento, lugarExpedicion)
      VALUES (@nombre, @tipoDocumento, @numeroDocumento, @lugarExpedicion)
    `);
    const resultado = stmt.run(paciente);
    
    return resultado;
  } catch (error) {
    console.error('Error al crear paciente:', error.message);
    return { error: error.message };
  }
});

ipcMain.handle('pacientes:actualizar', (_event, paciente) => {
  const stmt = db.prepare(`
    UPDATE pacientes SET
      nombre = @nombre,
      tipoDocumento = @tipoDocumento,
      numeroDocumento = @numeroDocumento,
      lugarExpedicion = @lugarExpedicion
    WHERE id = @id
  `);
  return stmt.run(paciente);
});

ipcMain.handle('pacientes:eliminar', (_event, id) => {
  return db.prepare('DELETE FROM pacientes WHERE id = ?').run(id);
});

// ========================
// MEDICOS
// ========================
ipcMain.handle('medicos:obtener', () => {
  return db.prepare('SELECT * FROM medicos').all();
});

ipcMain.handle('medicos:crear', (_event, medico) => {
  const stmt = db.prepare(`
    INSERT INTO medicos (nombre, cedula, registromedico, firma)
    VALUES (@nombre, @cedula, @registromedico, @firma)
  `);
  return stmt.run(medico);
});

ipcMain.handle('medicos:actualizar', (_event, medico) => {
  const stmt = db.prepare(`
    UPDATE medicos SET
      nombre = @nombre,
      cedula = @cedula,
      registromedico = @registromedico,
      firma = @firma
    WHERE id = @id
  `);
  return stmt.run(medico);
});

ipcMain.handle('medicos:eliminar', (_event, id) => {
  return db.prepare('DELETE FROM medicos WHERE id = ?').run(id);
});

// ========================
// ENFERMEROS
// ========================
ipcMain.handle('enfermeros:obtener', () => {
  return db.prepare('SELECT * FROM enfermeros').all();
});

ipcMain.handle('enfermeros:crear', (_event, enfermero) => {
  const stmt = db.prepare(`
    INSERT INTO enfermeros (nombre, documentoenfermero, firma)
    VALUES (@nombre, @documentoenfermero, @firma)
  `);
  return stmt.run(enfermero);
});
// ipcMain.handle('consentimientos:obtener', (_event, numeroDocumento) => {
//   return db.prepare(`
//     SELECT c.*, p.nombre as nombrePaciente, p.numeroDocumento,
//            m.nombre as nombreMedico, e.nombre as nombreEnfermero,
//            pl.nombre as nombrePlantilla, pl.codigo, pl.version, 
//            pl.fecha as fechaPlantilla, pl.contenido
//     FROM consentimientos c
//     JOIN pacientes p ON c.pacienteId = p.id
//     LEFT JOIN medicos m ON c.medicoId = m.id
//     LEFT JOIN enfermeros e ON c.enfermeroId = e.id
//     JOIN plantillas pl ON c.plantillaId = pl.id
//     WHERE p.numeroDocumento = ?
//     ORDER BY c.id DESC
//   `).all(numeroDocumento);
// });
ipcMain.handle('enfermeros:actualizar', (_event, enfermero) => {
  const stmt = db.prepare(`
    UPDATE enfermeros SET
      nombre = @nombre,
      documentoenfermero = @documentoenfermero,
      firma = @firma
    WHERE id = @id
  `);
  return stmt.run(enfermero);
});

ipcMain.handle('enfermeros:eliminar', (_event, id) => {
  return db.prepare('DELETE FROM enfermeros WHERE id = ?').run(id);
});

// ========================
// PLANTILLAS
// ========================
ipcMain.handle('plantillas:obtener', () => {
  return db.prepare('SELECT * FROM plantillas').all();
});

ipcMain.handle('plantillas:crear', (_event, plantilla) => {
  const stmt = db.prepare(`
    INSERT INTO plantillas (nombre, grupo, codigo, version, fecha, contenido)
    VALUES (@nombre, @grupo, @codigo, @version, @fecha, @contenido)
  `);
  return stmt.run(plantilla);
});

ipcMain.handle('plantillas:actualizar', (_event, plantilla) => {
  const stmt = db.prepare(`
    UPDATE plantillas SET
      nombre = @nombre,
      grupo = @grupo,
      codigo = @codigo,
      version = @version,
      fecha = @fecha,
      contenido = @contenido
    WHERE id = @id
  `);
  return stmt.run(plantilla);
});

ipcMain.handle('plantillas:eliminar', (_event, id) => {
  // ✅ Primero eliminar consentimientos asociados
  db.prepare('DELETE FROM consentimientos WHERE plantillaId = ?').run(id);
  // Luego eliminar la plantilla
  return db.prepare('DELETE FROM plantillas WHERE id = ?').run(id);
});

// ========================
// CONSENTIMIENTOS
// ========================
ipcMain.handle('consentimientos:obtener', (_event, numeroDocumento) => {
  return db.prepare(`
    SELECT c.*, p.nombre as nombrePaciente, p.numeroDocumento,
           m.nombre as nombreMedico, e.nombre as nombreEnfermero,
           pl.nombre as nombrePlantilla, pl.codigo, pl.version, pl.fecha as fechaPlantilla
    FROM consentimientos c
    JOIN pacientes p ON c.pacienteId = p.id
    LEFT JOIN medicos m ON c.medicoId = m.id
    LEFT JOIN enfermeros e ON c.enfermeroId = e.id
    JOIN plantillas pl ON c.plantillaId = pl.id
    WHERE p.numeroDocumento = ?
  `).all(numeroDocumento);
});

ipcMain.handle('consentimientos:crear', (_event, consentimiento) => {
  const stmt = db.prepare(`
    INSERT INTO consentimientos (pacienteId, medicoId, enfermeroId, plantillaId, fecha, firmaPaciente)
    VALUES (@pacienteId, @medicoId, @enfermeroId, @plantillaId, @fecha, @firmaPaciente)
  `);
  return stmt.run(consentimiento);
});

ipcMain.handle('consentimientos:eliminar', (_event, id) => {
  return db.prepare('DELETE FROM consentimientos WHERE id = ?').run(id);
});


// ========================
// APP
// ========================
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});