import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AjustesService {
  private claveCorrecta = '123456'; // Clave por defecto
  private autenticado = false;

  constructor(private router: Router) {}

  estaAutenticado(): boolean {
    return this.autenticado;
  }

  verificarClave(clave: string): boolean {
    if (clave === this.claveCorrecta) {
      this.autenticado = true;
      return true;
    }
    return false;
  }

  cerrarSesion(): void {
    this.autenticado = false;
    this.router.navigate(['/ajustes']);
  }

  cambiarClave(nuevaClave: string): void {
    this.claveCorrecta = nuevaClave;
  }
}