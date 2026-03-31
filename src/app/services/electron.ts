import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  private api: any;

  constructor() {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      this.api = (window as any).electronAPI;
    }
  }

  isElectron(): boolean {
    return !!this.api;
  }

  // ========================
  // WORD
  // ========================
  async seleccionarArchivo(): Promise<string | null> {
    return await this.api.seleccionarArchivo();
  }

  async leerWord(filePath: string): Promise<{ success: boolean; html?: string; error?: string }> {
    return await this.api.leerWord(filePath);
  }

  // ========================
  // PACIENTES
  // ========================
  async obtenerPacientes(): Promise<any[]> {
  try {
    console.log('llamando pacientes.obtener...');
    const resultado = await this.api.pacientes.obtener();
    console.log('resultado:', resultado);
    return resultado;
  } catch (error) {
    console.error('error en obtenerPacientes:', error);
    return [];
  }
}

  async crearPaciente(paciente: any): Promise<any> {
    return await this.api.pacientes.crear(paciente);
  }

  async actualizarPaciente(paciente: any): Promise<any> {
    return await this.api.pacientes.actualizar(paciente);
  }

  async eliminarPaciente(id: number): Promise<any> {
    return await this.api.pacientes.eliminar(id);
  }

  // ========================
  // MEDICOS
  // ========================
  async obtenerMedicos(): Promise<any[]> {
    return await this.api.medicos.obtener();
  }

  async crearMedico(medico: any): Promise<any> {
    return await this.api.medicos.crear(medico);
  }

  async actualizarMedico(medico: any): Promise<any> {
    return await this.api.medicos.actualizar(medico);
  }

  async eliminarMedico(id: number): Promise<any> {
    return await this.api.medicos.eliminar(id);
  }

  // ========================
  // ENFERMEROS
  // ========================
  async obtenerEnfermeros(): Promise<any[]> {
    return await this.api.enfermeros.obtener();
  }

  async crearEnfermero(enfermero: any): Promise<any> {
    return await this.api.enfermeros.crear(enfermero);
  }

  async actualizarEnfermero(enfermero: any): Promise<any> {
    return await this.api.enfermeros.actualizar(enfermero);
  }

  async eliminarEnfermero(id: number): Promise<any> {
    return await this.api.enfermeros.eliminar(id);
  }

  // ========================
  // PLANTILLAS
  // ========================
  async obtenerPlantillas(): Promise<any[]> {
    return await this.api.plantillas.obtener();
  }

  async crearPlantilla(plantilla: any): Promise<any> {
    return await this.api.plantillas.crear(plantilla);
  }

  async actualizarPlantilla(plantilla: any): Promise<any> {
    return await this.api.plantillas.actualizar(plantilla);
  }

  async eliminarPlantilla(id: number): Promise<any> {
    return await this.api.plantillas.eliminar(id);
  }

  // ========================
  // CONSENTIMIENTOS
  // ========================
  async obtenerConsentimientos(documentopaciente: string): Promise<any[]> {
    return await this.api.consentimientos.obtener(documentopaciente);
  }

  async crearConsentimiento(consentimiento: any): Promise<any> {
    return await this.api.consentimientos.crear(consentimiento);
  }

  async eliminarConsentimiento(id: number): Promise<any> {
    return await this.api.consentimientos.eliminar(id);
  }
}