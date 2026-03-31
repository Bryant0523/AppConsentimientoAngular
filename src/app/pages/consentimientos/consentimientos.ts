import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import SignaturePad from 'signature_pad';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ElectronService } from '../../services/electron';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? pdfFonts;

@Component({
  selector: 'app-consentimientos',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatSnackBarModule,
  ],
  templateUrl: './consentimientos.html',
  styleUrl: './consentimientos.css',
})
export class ConsentimientosComponent implements AfterViewInit, OnInit {
  @ViewChild('canvasFirma') canvasFirma!: ElementRef;

  signaturePad!: SignaturePad;
  medicos: any[] = [];
  enfermeros: any[] = [];
  documento = '';
  plantillas: any[] = [];
  firmaGuardada = '';
  plantillasFiltradas: any[] = [];
  buscarConsentimiento = '';
  gruposPlantillas: string[] = [];
  consentimientos: any[] = [];

  consentimiento = {
    medico: '',
    enfermero: '',
    fecha: '',
    grupoPlantilla: '',
    plantilla: '',
  };

  paciente: any = null;

  constructor(
    private route: ActivatedRoute,
    private electronService: ElectronService,
    private snackBar: MatSnackBar,
  ) {
    const doc = this.route.snapshot.params['documento'];
    if (doc) {
      this.documento = doc;
    }
  }

  async ngOnInit() {
    // ✅ Cargar todo desde SQLite
    const pacientes = await this.electronService.obtenerPacientes();
    this.paciente = pacientes.find(
      (p: any) => p.documentopaciente == this.documento
    );

    this.medicos = await this.electronService.obtenerMedicos();
    this.enfermeros = await this.electronService.obtenerEnfermeros();
    this.plantillas = await this.electronService.obtenerPlantillas();

    const grupos = this.plantillas.map((p: any) => p.grupo);
    this.gruposPlantillas = [...new Set(grupos)] as string[];

    if (this.documento) {
      this.consentimientos = await this.electronService.obtenerConsentimientos(
        this.documento
      );
    }
  }

  ngAfterViewInit() {
  if (!this.canvasFirma) return; 
  
  const canvas = this.canvasFirma.nativeElement;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = 400 * ratio;
  canvas.height = 200 * ratio;
  canvas.style.width = '400px';
  canvas.style.height = '200px';
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  this.signaturePad = new SignaturePad(canvas);
}

  private mostrarMensaje(mensaje: string, tipo: 'exito' | 'error' = 'exito') {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: tipo === 'exito' ? ['snack-exito'] : ['snack-error'],
    });
  }

  limpiarFirma() {
    this.signaturePad.clear();
    this.firmaGuardada = '';
  }

  guardarFirma() {
    if (this.signaturePad.isEmpty()) {
      this.mostrarMensaje('El paciente debe firmar primero', 'error');
      return;
    }
    this.firmaGuardada = this.signaturePad.toDataURL();
    this.mostrarMensaje('✅ Firma guardada');
  }

  filtrarPlantillas() {
    this.plantillasFiltradas = this.plantillas.filter(
      (p: any) => p.grupo === this.consentimiento.grupoPlantilla,
    );
    this.consentimiento.plantilla = '';
  }

  async generarConsentimiento() {
    if (!this.signaturePad.isEmpty()) {
      this.firmaGuardada = this.signaturePad.toDataURL();
    }

    const medicoSeleccionado = this.medicos.find(
      (m: any) => m.nombre === this.consentimiento.medico,
    );

    const enfermeroSeleccionado = this.enfermeros.find(
      (e: any) => e.nombre === this.consentimiento.enfermero,
    );

    const plantillaSeleccionada = this.plantillas.find(
      (p: any) => p.nombre === this.consentimiento.plantilla,
    );

    if (!plantillaSeleccionada) {
      this.mostrarMensaje('Debe seleccionar una plantilla', 'error');
      return;
    }

    if (!this.firmaGuardada) {
      this.mostrarMensaje('El paciente debe firmar primero', 'error');
      return;
    }

    // ✅ Guardar consentimiento en SQLite
    try {
      await this.electronService.crearConsentimiento({
        pacienteId: this.paciente.id,
        medicoId: medicoSeleccionado?.id || null,
        enfermeroId: enfermeroSeleccionado?.id || null,
        plantillaId: plantillaSeleccionada.id,
        fecha: this.consentimiento.fecha,
        firmaPaciente: this.firmaGuardada,
      });

      this.consentimientos = await this.electronService.obtenerConsentimientos(
        this.documento
      );
      this.mostrarMensaje('✅ Consentimiento guardado correctamente');
    } catch (error) {
      this.mostrarMensaje('Error al guardar el consentimiento', 'error');
      return;
    }

    const codigo = plantillaSeleccionada?.codigo || '';
    const version = plantillaSeleccionada?.version || '';
    const fechaPlantilla = plantillaSeleccionada?.fecha || '';

    let texto = plantillaSeleccionada?.contenido || '';

    texto = texto
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    texto = texto.replaceAll('{{paciente.nombre}}', this.paciente.nombre);
    texto = texto.replaceAll('{{paciente.numeroDocumento}}', this.paciente.documentopaciente);
    texto = texto.replaceAll('{{medico}}', this.consentimiento.medico);
    texto = texto.replaceAll('{{enfermero}}', this.consentimiento.enfermero);
    texto = texto.replaceAll('{{fecha}}', this.consentimiento.fecha);

    const firmasPaciente = this.firmaGuardada
      ? [{ image: this.firmaGuardada, width: 80, height: 40 }]
      : [{ text: '' }];

    const firmasMedico = medicoSeleccionado?.firma
      ? [{ image: medicoSeleccionado.firma, width: 80, height: 40 }]
      : [{ text: '' }];

    const firmasEnfermero = enfermeroSeleccionado?.firma
      ? [{ image: enfermeroSeleccionado.firma, width: 80, height: 40 }]
      : [{ text: '' }];

    const parrafos = texto
      .split('\n')
      .filter((p: string) => p.trim() !== '')
      .map((p: string) => ({
        text: p.trim().replace(/\s+/g, ' '),
        style: 'body',
        alignment: 'justify',
        marginBottom: 10,
      }));

    const docDefinition: any = {
      pageMargins: [40, 40, 40, 60],
      content: [
        {
          table: {
            widths: ['30%', '*', '25%'],
            body: [
              [
                { text: '', border: [true, true, true, true] },
                {
                  stack: [
                    { text: 'DHI COLOMBIA – BARRANQUILLA S.A.S', style: 'headerCenter' },
                    { text: 'DIRECCIÓN MEDICA', style: 'headerCenter' },
                    { text: 'CONSENTIMIENTO INFORMADO', style: 'headerCenter' },
                    { text: plantillaSeleccionada.nombre, style: 'headerCenter' },
                  ],
                  border: [true, true, true, true],
                },
                {
                  stack: [
                    { text: `Código: ${codigo}`, style: 'headerRight' },
                    { text: `Versión: ${version}`, style: 'headerRight' },
                    { text: `Fecha: ${fechaPlantilla}`, style: 'headerRight' },
                    { text: 'Página: 1', style: 'headerRight' },
                  ],
                  border: [true, true, true, true],
                },
              ],
            ],
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
                { text: 'Firma del paciente', style: 'firmaLabel' },
              ],
            },
            { width: '*', text: '' },
            {
              width: '40%',
              stack: [
                ...firmasMedico,
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 150, y2: 5, lineWidth: 1 }] },
                { text: 'Firma del médico', style: 'firmaLabel' },
              ],
            },
          ],
        },
        {
          marginTop: 30,
          columns: [
            { width: '*', text: '' },
            {
              width: '40%',
              stack: [
                ...firmasEnfermero,
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 150, y2: 5, lineWidth: 1 }] },
                { text: 'Firma del enfermero', style: 'firmaLabel' },
              ],
            },
            { width: '*', text: '' },
          ],
        },
      ],
      styles: {
        headerCenter: {
          fontSize: 10,
          bold: true,
          alignment: 'center',
          lineHeight: 1.4,
        },
        headerRight: {
          fontSize: 9,
          alignment: 'left',
          lineHeight: 1.4,
        },
        body: {
          fontSize: 11,
          lineHeight: 1.5,
        },
        firmaLabel: {
          fontSize: 10,
          marginTop: 4,
        },
      },
    };

    pdfMake.createPdf(docDefinition).download(
      `consentimiento-${this.paciente.documentopaciente}.pdf`
    );
  }

  verConsentimiento(c: any) {
    const codigo = c.codigo || '';
    const version = c.version || '';
    const fechaPlantilla = c.fechaPlantilla || '';

    const firmasPaciente = c.firmaPaciente
      ? [{ image: c.firmaPaciente, width: 80, height: 40 }]
      : [{ text: '' }];

    const docDefinition: any = {
      pageMargins: [40, 40, 40, 60],
      content: [
        {
          table: {
            widths: ['30%', '*', '25%'],
            body: [
              [
                { text: '', border: [true, true, true, true] },
                {
                  stack: [
                    { text: 'DHI COLOMBIA – BARRANQUILLA S.A.S', style: 'headerCenter' },
                    { text: 'DIRECCIÓN MEDICA', style: 'headerCenter' },
                    { text: 'CONSENTIMIENTO INFORMADO', style: 'headerCenter' },
                    { text: c.nombrePlantilla || '', style: 'headerCenter' },
                  ],
                  border: [true, true, true, true],
                },
                {
                  stack: [
                    { text: `Código: ${codigo}`, style: 'headerRight' },
                    { text: `Versión: ${version}`, style: 'headerRight' },
                    { text: `Fecha: ${fechaPlantilla}`, style: 'headerRight' },
                    { text: 'Página: 1', style: 'headerRight' },
                  ],
                  border: [true, true, true, true],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
          },
          marginBottom: 16,
        },
        {
          text: c.contenido || '',
          fontSize: 11,
          alignment: 'justify',
          lineHeight: 1.5,
          marginBottom: 30,
        },
        {
          marginTop: 30,
          columns: [
            {
              width: '40%',
              stack: [
                ...firmasPaciente,
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 150, y2: 5, lineWidth: 1 }] },
                { text: 'Firma del paciente', fontSize: 10, marginTop: 4 },
              ],
            },
          ],
        },
      ],
      styles: {
        headerCenter: {
          fontSize: 10,
          bold: true,
          alignment: 'center',
          lineHeight: 1.4,
        },
        headerRight: {
          fontSize: 9,
          alignment: 'left',
          lineHeight: 1.4,
        },
      },
    };

    pdfMake.createPdf(docDefinition).download(
      `consentimiento-${c.documentopaciente}.pdf`
    );
  }

  async eliminarConsentimiento(id: number) {
    try {
      await this.electronService.eliminarConsentimiento(id);
      this.consentimientos = await this.electronService.obtenerConsentimientos(
        this.documento
      );
      this.mostrarMensaje('✅ Consentimiento eliminado');
    } catch (error) {
      this.mostrarMensaje('Error al eliminar el consentimiento', 'error');
    }
  }
}