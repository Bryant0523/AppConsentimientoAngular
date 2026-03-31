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
  selector: 'app-medicos',
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
  templateUrl: './medicos.html',
  styleUrls: ['./medicos.css'],
})
export class MedicosComponent implements OnInit {
  mostrarFormulario = false;
  idEditando: number | null = null;
  medicos: any[] = [];
  buscarMedico = '';
  cargando = true;

  nuevoMedico = {
    nombre: '',
    cedula: '',
    registromedico: '',
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
      this.medicos = await this.electronService.obtenerMedicos();
      this.cargando = false;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error:', error);
      this.cargando = false;
    }
  }

  async cargarMedicos() {
    this.medicos = await this.electronService.obtenerMedicos();
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

  async guardarMedico() {
    if (!this.nuevoMedico.nombre || !this.nuevoMedico.cedula) {
      this.mostrarMensaje('Nombre y documento son obligatorios', 'error');
      return;
    }

    try {
      if (this.idEditando !== null) {
        await this.electronService.actualizarMedico({
          ...this.nuevoMedico,
          id: this.idEditando,
        });
        this.mostrarMensaje('✅ Médico actualizado correctamente');
        this.idEditando = null;
      } else {
        await this.electronService.crearMedico(this.nuevoMedico);
        this.mostrarMensaje('✅ Médico guardado correctamente');
      }

      await this.cargarMedicos();
      this.limpiarFormulario();
      this.mostrarFormulario = false;
    } catch (error: any) {
      if (error.message?.includes('UNIQUE')) {
        this.mostrarMensaje('Ya existe un médico con ese documento', 'error');
      } else {
        this.mostrarMensaje('Error al guardar el médico', 'error');
      }
    }
  }

  editarMedico(m: any) {
    this.nuevoMedico = {
      nombre: m.nombre,
      cedula: m.cedula,
      registromedico: m.registromedico,
      firma: m.firma,
    };
    this.idEditando = m.id;
    this.mostrarFormulario = true;
  }

  async eliminarMedico(id: number) {
    try {
      await this.electronService.eliminarMedico(id);
      this.mostrarMensaje('✅ Médico eliminado');
      await this.cargarMedicos();
    } catch (error) {
      this.mostrarMensaje('Error al eliminar el médico', 'error');
    }
  }

  subirFirma(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.nuevoMedico.firma = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(archivo);
  }

  limpiarFormulario() {
    this.nuevoMedico = {
      nombre: '',
      cedula: '',
      registromedico: '',
      firma: '',
    };
    this.idEditando = null;
  }
}