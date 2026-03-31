import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ElectronService } from '../../services/electron';

@Component({
  selector: 'app-enfermeros',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './enfermeros.html',
  styleUrls: ['./enfermeros.css'],
})
export class EnfermerosComponent implements OnInit {
  mostrarFormulario = false;
  enfermeros: any[] = [];
  idEditando: number | null = null;
  buscarEnfermero = '';
  cargando = true;

  nuevoEnfermero = {
    nombre: '',
    documentoenfermero: '',
    firma: '',
  };

  constructor(
    private electronService: ElectronService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.cargando = true;
    try {
      this.enfermeros = await this.electronService.obtenerEnfermeros();
      this.cargando = false;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error:', error);
      this.cargando = false;
    }
  }

  async cargarEnfermeros() {
    this.enfermeros = await this.electronService.obtenerEnfermeros();
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

  async guardarEnfermero() {
    if (!this.nuevoEnfermero.nombre || !this.nuevoEnfermero.documentoenfermero) {
      this.mostrarMensaje('Nombre y documento son obligatorios', 'error');
      return;
    }

    try {
      if (this.idEditando !== null) {
        await this.electronService.actualizarEnfermero({
          ...this.nuevoEnfermero,
          id: this.idEditando,
        });
        this.mostrarMensaje('✅ Enfermero actualizado correctamente');
        this.idEditando = null;
      } else {
        await this.electronService.crearEnfermero(this.nuevoEnfermero);
        this.mostrarMensaje('✅ Enfermero guardado correctamente');
      }

      await this.cargarEnfermeros();
      this.limpiarFormulario();
      this.mostrarFormulario = false;
    } catch (error: any) {
      if (error.message?.includes('UNIQUE')) {
        this.mostrarMensaje('Ya existe un enfermero con ese documento', 'error');
      } else {
        this.mostrarMensaje('Error al guardar el enfermero', 'error');
      }
    }
  }

  editarEnfermero(e: any) {
    this.nuevoEnfermero = {
      nombre: e.nombre,
      documentoenfermero: e.documentoenfermero,
      firma: e.firma,
    };
    this.idEditando = e.id;
    this.mostrarFormulario = true;
  }

  async eliminarEnfermero(id: number) {
    try {
      await this.electronService.eliminarEnfermero(id);
      this.mostrarMensaje('✅ Enfermero eliminado');
      await this.cargarEnfermeros();
    } catch (error) {
      this.mostrarMensaje('Error al eliminar el enfermero', 'error');
    }
  }

  subirFirma(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.nuevoEnfermero.firma = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(archivo);
  }

  limpiarFormulario() {
    this.nuevoEnfermero = {
      nombre: '',
      documentoenfermero: '',
      firma: '',
    };
    this.idEditando = null;
  }
}