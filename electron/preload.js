const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ========================
  // WORD
  // ========================
  leerWord: (filePath) => ipcRenderer.invoke('leer-word', filePath),
  seleccionarArchivo: () => ipcRenderer.invoke('seleccionar-archivo'),
  //LOGO
  cargarLogo: (ruta) => ipcRenderer.invoke('cargar-logo', ruta),
  // ========================
  // PACIENTES
  // ========================
  pacientes: {
    obtener: () => ipcRenderer.invoke('pacientes:obtener'),
    crear: (paciente) => ipcRenderer.invoke('pacientes:crear', paciente),
    actualizar: (paciente) => ipcRenderer.invoke('pacientes:actualizar', paciente),
    eliminar: (id) => ipcRenderer.invoke('pacientes:eliminar', id),
  },

  // ========================
  // MEDICOS
  // ========================
  medicos: {
    obtener: () => ipcRenderer.invoke('medicos:obtener'),
    crear: (medico) => ipcRenderer.invoke('medicos:crear', medico),
    actualizar: (medico) => ipcRenderer.invoke('medicos:actualizar', medico),
    eliminar: (id) => ipcRenderer.invoke('medicos:eliminar', id),
  },

  // ========================
  // ENFERMEROS
  // ========================
  enfermeros: {
    obtener: () => ipcRenderer.invoke('enfermeros:obtener'),
    crear: (enfermero) => ipcRenderer.invoke('enfermeros:crear', enfermero),
    actualizar: (enfermero) => ipcRenderer.invoke('enfermeros:actualizar', enfermero),
    eliminar: (id) => ipcRenderer.invoke('enfermeros:eliminar', id),
  },

  // ========================
  // PLANTILLAS
  // ========================
  plantillas: {
    obtener: () => ipcRenderer.invoke('plantillas:obtener'),
    crear: (plantilla) => ipcRenderer.invoke('plantillas:crear', plantilla),
    actualizar: (plantilla) => ipcRenderer.invoke('plantillas:actualizar', plantilla),
    eliminar: (id) => ipcRenderer.invoke('plantillas:eliminar', id),
  },


grupos: {
  obtener: () => ipcRenderer.invoke('grupos:obtener'),
  crear: (nombre) => ipcRenderer.invoke('grupos:crear', nombre),
  eliminar: (id) => ipcRenderer.invoke('grupos:eliminar', id),
},

historial: {
  obtener: () => ipcRenderer.invoke('historial:obtener'),
  limpiarAntiguos: () => ipcRenderer.invoke('historial:limpiar-antiguos'),
},
  // ========================
  // CONSENTIMIENTOS
  // ========================
  consentimientos: {
    obtener: (documentopaciente) => ipcRenderer.invoke('consentimientos:obtener', documentopaciente),
    crear: (consentimiento) => ipcRenderer.invoke('consentimientos:crear', consentimiento),
    eliminar: (id) => ipcRenderer.invoke('consentimientos:eliminar', id),
  },
});