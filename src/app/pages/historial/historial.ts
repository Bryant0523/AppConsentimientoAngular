import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon'
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ElectronService } from '../../services/electron';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? pdfFonts;

@Component({
  selector: 'app-historial',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
})
export class HistorialComponent implements OnInit {
  consentimientos: any[] = [];
  buscar = '';
  cargando = true;
  private logoBase64 = '';

  constructor(
    private electronService: ElectronService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.limpiarAntiguos();
    await this.cargarHistorial();
    this.logoBase64 = await this.electronService.cargarLogo('logo.jpg') || '';
  }

  async cargarHistorial() {
    this.cargando = true;
    this.consentimientos = await this.electronService.obtenerHistorial();
    this.cargando = false;
    this.cdr.markForCheck();
  }

  async limpiarAntiguos() {
    await this.electronService.limpiarHistorialAntiguo();
  }

  private mostrarMensaje(mensaje: string, tipo: 'exito' | 'error' = 'exito') {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: tipo === 'exito' ? ['snack-exito'] : ['snack-error'],
    });
  }

  async eliminarConsentimiento(id: number) {
    try {
      await this.electronService.eliminarConsentimiento(id);
      await this.cargarHistorial();
      this.mostrarMensaje('✅ Consentimiento eliminado');
    } catch (error) {
      this.mostrarMensaje('Error al eliminar', 'error');
    }
  }

  verPDF(c: any) {
    const codigo = c.codigo || '';
    const version = c.version || '';
    const fechaPlantilla = c.fechaPlantilla || '';

    let texto = c.contenido || '';
    texto = texto
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    texto = texto.replaceAll('{{paciente.nombre}}', c.nombrePaciente || '');
    texto = texto.replaceAll('{{paciente.numeroDocumento}}', c.numeroDocumento || '');
    texto = texto.replaceAll('{{medico}}', c.nombreMedico || '');
    texto = texto.replaceAll('{{enfermero}}', c.nombreEnfermero || '');
    texto = texto.replaceAll('{{fecha}}', c.fecha || '');
    texto = texto.replaceAll('{{paciente.lugarExpedicion}}', c.lugarExpedicion || '');

    const parrafos = texto
      .split('\n')
      .filter((p: string) => p.trim() !== '')
      .map((p: string) => ({
        text: p.trim().replace(/\s+/g, ' '),
        fontSize: 11,
        alignment: 'justify',
        lineHeight: 1.5,
        marginBottom: 10,
      }));

    const firmasPaciente = c.firmaPaciente
      ? [{ image: c.firmaPaciente, width: 80, height: 40 }]
      : [{ text: '' }];

    const docDefinition: any = {
      pageMargins: [40, 40, 40, 60],
      content: [
        {
          table: {
            widths: ['30%', '*', '25%'],
            body: [[
              {
                stack: this.logoBase64
                  ? [{ image: this.logoBase64, width: 100, height: 50, alignment: 'center' }]
                  : [{ text: '' }],
                border: [true, true, true, true],
              },
              {
                stack: [
                  { text: 'DHI COLOMBIA – BARRANQUILLA S.A.S', fontSize: 10, bold: true, alignment: 'center' },
                  { text: 'DIRECCIÓN MEDICA', fontSize: 10, bold: true, alignment: 'center' },
                  { text: 'CONSENTIMIENTO INFORMADO', fontSize: 10, bold: true, alignment: 'center' },
                  { text: c.nombrePlantilla || '', fontSize: 10, bold: true, alignment: 'center' },
                ],
                border: [true, true, true, true],
              },
              {
                stack: [
                  { text: `Código: ${codigo}`, fontSize: 9 },
                  { text: `Versión: ${version}`, fontSize: 9 },
                  { text: `Fecha: ${fechaPlantilla}`, fontSize: 9 },
                  { text: 'Página: 1', fontSize: 9 },
                ],
                border: [true, true, true, true],
              },
            ]],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
          },
          marginBottom: 16,
        },
        ...parrafos,
        {
          marginTop: 30,
          columns: [
            {
              width: '40%',
              stack: [
                ...firmasPaciente,
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 150, y2: 5, lineWidth: 1 }] },
                { text: 'Firma del paciente', fontSize: 10, marginTop: 4 },
                { text: c.nombrePaciente || '', fontSize: 9, marginTop: 2 },
                { text: `C.C. ${c.numeroDocumento || ''}`, fontSize: 9 },
              ],
            },
          ],
        },
      ],
    };

    pdfMake.createPdf(docDefinition).download(
      `consentimiento-${c.numeroDocumento}.pdf`
    );
  }

  get consentimientosFiltrados() {
    const b = this.buscar.toLowerCase();
    return this.consentimientos.filter(c =>
      c.nombrePaciente?.toLowerCase().includes(b) ||
      c.numeroDocumento?.toString().includes(b) ||
      c.nombrePlantilla?.toLowerCase().includes(b)
    );
  }
}