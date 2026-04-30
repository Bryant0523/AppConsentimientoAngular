import { Injectable } from '@angular/core';

declare global {
  interface Window {
    electronAPI: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class ElectronService {

  private get api() {
    return window.electronAPI;
  }

  // ========================
  // WORD
  // ========================
  leerWord(filePath: string): Promise<{ success: boolean; html?: string; error?: string }> {
    return this.api.leerWord(filePath);
  }

  seleccionarArchivo(): Promise<string | null> {
    return this.api.seleccionarArchivo();
  }

  // ========================
  // LOGO
  // ========================
  cargarLogo(nombreArchivo: string): Promise<string | null> {
    return this.api.cargarLogo(nombreArchivo);
  }

  // ========================
  // PACIENTES
  // ========================
  obtenerPacientes(): Promise<any[]> {
    return this.api.pacientes.obtener();
  }

  crearPaciente(paciente: any): Promise<any> {
    return this.api.pacientes.crear(paciente);
  }

  actualizarPaciente(paciente: any): Promise<any> {
    return this.api.pacientes.actualizar(paciente);
  }

  eliminarPaciente(id: number): Promise<any> {
    return this.api.pacientes.eliminar(id);
  }

  // ========================
  // MEDICOS
  // ========================
  obtenerMedicos(): Promise<any[]> {
    return this.api.medicos.obtener();
  }

  crearMedico(medico: any): Promise<any> {
    return this.api.medicos.crear(medico);
  }

  actualizarMedico(medico: any): Promise<any> {
    return this.api.medicos.actualizar(medico);
  }

  eliminarMedico(id: number): Promise<any> {
    return this.api.medicos.eliminar(id);
  }

  // ========================
  // ENFERMEROS
  // ========================
  obtenerEnfermeros(): Promise<any[]> {
    return this.api.enfermeros.obtener();
  }

  crearEnfermero(enfermero: any): Promise<any> {
    return this.api.enfermeros.crear(enfermero);
  }

  actualizarEnfermero(enfermero: any): Promise<any> {
    return this.api.enfermeros.actualizar(enfermero);
  }

  eliminarEnfermero(id: number): Promise<any> {
    return this.api.enfermeros.eliminar(id);
  }

  // ========================
  // GRUPOS
  // ========================
  obtenerGrupos(): Promise<any[]> {
    return this.api.grupos.obtener();
  }

  crearGrupo(nombre: string): Promise<any> {
    return this.api.grupos.crear(nombre);
  }

  eliminarGrupo(id: number): Promise<any> {
    return this.api.grupos.eliminar(id);
  }

  // ========================
  // PLANTILLAS
  // ========================
  obtenerPlantillas(): Promise<any[]> {
    return this.api.plantillas.obtener();
  }

  crearPlantilla(plantilla: any): Promise<any> {
    return this.api.plantillas.crear(plantilla);
  }

  actualizarPlantilla(plantilla: any): Promise<any> {
    return this.api.plantillas.actualizar(plantilla);
  }

  eliminarPlantilla(id: number): Promise<any> {
    return this.api.plantillas.eliminar(id);
  }

  // ========================
  // CONSENTIMIENTOS
  // ========================
  obtenerConsentimientos(documentoPaciente: string): Promise<any[]> {
    return this.api.consentimientos.obtener(documentoPaciente);
  }

  crearConsentimiento(consentimiento: any): Promise<any> {
    return this.api.consentimientos.crear(consentimiento);
  }

  eliminarConsentimiento(id: number): Promise<any> {
    return this.api.consentimientos.eliminar(id);
  }

  // ========================
  // HISTORIAL
  // ========================
  obtenerHistorial(): Promise<any[]> {
    return this.api.historial.obtener();
  }

  limpiarHistorialAntiguo(): Promise<any> {
    return this.api.historial.limpiarAntiguos();
  }
}