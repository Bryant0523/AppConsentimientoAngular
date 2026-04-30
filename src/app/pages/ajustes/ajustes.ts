import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon'

import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ElectronService } from '../../services/electron';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './ajustes.html',
})
export class AjustesComponent implements OnInit {
  password = '';
  autorizado = false;
  nuevoGrupo = '';
  grupos: any[] = [];

  constructor(
    private electronService: ElectronService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {
    if (localStorage.getItem('admin')) {
      this.autorizado = true;
    }
  }

  async ngOnInit() {
    await this.cargarGrupos();
  }

  async cargarGrupos() {
    this.grupos = await this.electronService.obtenerGrupos();
    this.cdr.markForCheck();
  }

  private mostrarMensaje(mensaje: string, tipo: 'exito' | 'error' = 'exito') {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: tipo === 'exito' ? ['snack-exito'] : ['snack-error'],
    });
  }

  validar() {
    if (this.password === 'admin123') {
      this.autorizado = true;
      localStorage.setItem('admin', 'true');
      this.cdr.markForCheck();
    } else {
      this.mostrarMensaje('Contraseña incorrecta', 'error');
    }
  }

  logout() {
    localStorage.removeItem('admin');
    this.autorizado = false;
    this.cdr.markForCheck();
  }

  async agregarGrupo() {
    if (!this.nuevoGrupo.trim()) {
      this.mostrarMensaje('Escribe un nombre para el grupo', 'error');
      return;
    }

    try {
      await this.electronService.crearGrupo(this.nuevoGrupo.trim());
      this.nuevoGrupo = '';
      await this.cargarGrupos();
      this.mostrarMensaje('✅ Grupo creado correctamente');
    } catch (error: any) {
      if (error.message?.includes('UNIQUE')) {
        this.mostrarMensaje('Ya existe un grupo con ese nombre', 'error');
      } else {
        this.mostrarMensaje('Error al crear el grupo', 'error');
      }
    }
  }

  async eliminarGrupo(id: number) {
    try {
      await this.electronService.eliminarGrupo(id);
      await this.cargarGrupos();
      this.mostrarMensaje('✅ Grupo eliminado');
    } catch (error) {
      this.mostrarMensaje('Error al eliminar el grupo', 'error');
    }
  }
}
