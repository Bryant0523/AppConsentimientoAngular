import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ElectronService } from '../../services/electron';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-plantillas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule,
  ],
  templateUrl: './plantillas.html',
  styleUrls: ['./plantillas.css'],
})
export class PlantillasComponent implements OnInit {
  mostrarFormulario = false;
  plantillas: any[] = [];
  idEditando: number | null = null;
  buscarPlantilla = '';
  cargando = true;

  nuevaPlantilla = {
    nombre: '',
    grupo: '',
    codigo: '',
    version: '',
    fecha: '',
    contenido: '',
  };

  constructor(
    private electronService: ElectronService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.cargando = true;
    try {
      this.plantillas = await this.electronService.obtenerPlantillas();
      this.cargando = false;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error:', error);
      this.cargando = false;
    }
  }

  async cargarPlantillas() {
    this.plantillas = await this.electronService.obtenerPlantillas();
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

  async guardarPlantilla() {
    if (!this.nuevaPlantilla.nombre) {
      this.mostrarMensaje('El nombre de la plantilla es obligatorio', 'error');
      return;
    }

    try {
      if (this.idEditando !== null) {
        await this.electronService.actualizarPlantilla({
          ...this.nuevaPlantilla,
          id: this.idEditando,
        });
        this.mostrarMensaje('✅ Plantilla actualizada correctamente');
        this.idEditando = null;
      } else {
        await this.electronService.crearPlantilla(this.nuevaPlantilla);
        this.mostrarMensaje('✅ Plantilla guardada correctamente');
      }

      await this.cargarPlantillas();
      this.limpiarFormulario();
      this.mostrarFormulario = false;
    } catch (error: any) {
      this.mostrarMensaje('Error al guardar la plantilla', 'error');
    }
  }

  editarPlantilla(p: any) {
    this.nuevaPlantilla = {
      nombre: p.nombre,
      grupo: p.grupo,
      codigo: p.codigo,
      version: p.version,
      fecha: p.fecha,
      contenido: p.contenido,
    };
    this.idEditando = p.id;
    this.mostrarFormulario = true;
    this.cdr.markForCheck();
  }

  async eliminarPlantilla(id: number) {
    try {
      await this.electronService.eliminarPlantilla(id);
      this.mostrarMensaje('✅ Plantilla eliminada');
      await this.cargarPlantillas();
    } catch (error) {
      this.mostrarMensaje('Error al eliminar la plantilla', 'error');
    }
  }

  copiar(texto: string) {
    navigator.clipboard.writeText(texto);
    this.mostrarMensaje('✅ Variable copiada');
  }

  async subirWord() {
    const filePath = await this.electronService.seleccionarArchivo();
    if (!filePath) return;

    const resultado = await this.electronService.leerWord(filePath);

    if (!resultado.success) {
      this.mostrarMensaje('Error al leer el archivo: ' + resultado.error, 'error');
      return;
    }

    let html = resultado.html || '';

    html = html
      .replace(/\uFFFD/g, '')
      .replace(/<p><br><\/p>/gi, '\n\n')
      .replace(/<p><\/p>/gi, '\n\n')
      .replace(/<\/p>\s*<p>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\n\n+/g, '\n\n')
      .trim();

    this.nuevaPlantilla.contenido = html;
    this.cdr.markForCheck(); 
    this.mostrarMensaje('✅ Word subido correctamente');
  }

  limpiarFormulario() {
    this.nuevaPlantilla = {
      nombre: '',
      grupo: '',
      codigo: '',
      version: '',
      fecha: '',
      contenido: '',
    };
    this.idEditando = null;
  }
}