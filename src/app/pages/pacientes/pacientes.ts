import { Component, OnInit, ChangeDetectorRef   } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ElectronService } from '../../services/electron';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ChangeDetectionStrategy } from '@angular/core';



@Component({
  selector: 'app-pacientes',
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
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css',
})
export class PacientesComponent implements OnInit {
  buscar = '';
  mostrarFormulario = false;
  idEditando: number | null = null;
  
  paciente = {
    nombre: '',
    tipoDocumento: '',
    numeroDocumento: '',
    lugarExpedicion: '',
  };

  pacientes: any[] = [];
  cargando = true;
  constructor(
    private electronService: ElectronService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef
    
  ) {this.router.events.pipe(
    filter(e => e instanceof NavigationEnd)
  ).subscribe(() => {
    this.cargarPacientes();
  });}

  async ngOnInit() {
  this.cargando = true;
  try {
    this.pacientes = await this.electronService.obtenerPacientes();
    this.cargando = false;
    this.cdr.markForCheck(); 
  } catch (error) {
    console.error('Error:', error);
    this.cargando = false;
  }
}

async cargarPacientes() {
  this.pacientes = await this.electronService.obtenerPacientes();
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

  async guardarPaciente() {
    if (!this.paciente.nombre || !this.paciente.numeroDocumento) {
      this.mostrarMensaje('Nombre y documento son obligatorios', 'error');
      return;
    }

    try {
      if (this.idEditando !== null) {
        await this.electronService.actualizarPaciente({
          ...this.paciente,
          id: this.idEditando,
        });
        this.mostrarMensaje('✅ Paciente actualizado correctamente');
        this.idEditando = null;
      } else {
        await this.electronService.crearPaciente(this.paciente);
        this.mostrarMensaje('✅ Paciente guardado correctamente');
      }

      await this.cargarPacientes();
      this.limpiarFormulario();
      this.mostrarFormulario = false;
    } catch (error: any) {
      if (error.message?.includes('UNIQUE')) {
        this.mostrarMensaje('Ya existe un paciente con ese documento', 'error');
      } else {
        this.mostrarMensaje('Error al guardar el paciente', 'error');
      }
    }
  }

  editarPaciente(p: any) {
    this.paciente = {
      nombre: p.nombre,
      tipoDocumento: p.tipoDocumento,
      numeroDocumento: p.numeroDocumento,
      lugarExpedicion: p.lugarExpedicion,
    };
    this.idEditando = p.id;
    this.mostrarFormulario = true;
  }

  async eliminarPaciente(id: number) {
    try {
      await this.electronService.eliminarPaciente(id);
      this.mostrarMensaje('✅ Paciente eliminado');
      await this.cargarPacientes();
    } catch (error) {
      this.mostrarMensaje('Error al eliminar el paciente', 'error');
    }
  }

  crearConsentimiento(documentopaciente: string) {
    window.location.href = '/consentimientos/' + documentopaciente;
  }

  limpiarFormulario() {
    this.paciente = {
      nombre: '',
      tipoDocumento: '',
      numeroDocumento: '',
      lugarExpedicion: '',
    };
    this.idEditando = null;
  }
}