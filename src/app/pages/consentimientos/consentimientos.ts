import {
  Component, AfterViewInit, ElementRef, ViewChild,
  OnInit, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ElectronService } from '../../services/electron';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? pdfFonts;

@Component({
  selector: 'app-consentimientos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatSnackBarModule,
    MatCheckboxModule,
  ],
  templateUrl: './consentimientos.html',
  styleUrl: './consentimientos.css',
})
export class ConsentimientosComponent implements AfterViewInit, OnInit {

  @ViewChild('canvasFirma') canvasFirma!: ElementRef;
  @ViewChild('canvasFirmaAcudiente') canvasFirmaAcudiente!: ElementRef;

  signaturePad!: SignaturePad;
  signaturePadAcudiente!: SignaturePad;

  medicos: any[] = [];
  enfermeros: any[] = [];
  documento = '';
  plantillas: any[] = [];
  firmaGuardada = '';
  firmaAcudienteGuardada = '';
  plantillasFiltradas: any[] = [];
  gruposPlantillas: string[] = [];
  consentimientos: any[] = [];
  private logoBase64 = '';

  consentimiento = {
    medico: '',
    enfermero: '',
    fecha: new Date().toISOString().split('T')[0],
    grupoPlantilla: '',
    plantilla: '',
  };

  // Datos del menor / acudiente
  esMenor = false;
  acudiente = {
    nombre: '',
    documento: '',
    parentesco: '',
  };

  paciente: any = null;

  constructor(
    private route: ActivatedRoute,
    private electronService: ElectronService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {
    const doc = this.route.snapshot.params['documento'];
    if (doc) this.documento = doc;
  }

  async ngOnInit() {
    const pacientes = await this.electronService.obtenerPacientes();
    this.paciente = pacientes.find((p: any) => p.numeroDocumento == this.documento);
    await this.cargarLogo();
    this.medicos = await this.electronService.obtenerMedicos();
    this.enfermeros = await this.electronService.obtenerEnfermeros();
    this.plantillas = await this.electronService.obtenerPlantillas();

    const grupos = await this.electronService.obtenerGrupos();
    this.gruposPlantillas = grupos.map((g: any) => g.nombre);

    if (this.documento) {
      this.consentimientos = await this.electronService.obtenerConsentimientos(this.documento);
    }

    setTimeout(() => this.inicializarFirmas(), 100);
    this.cdr.markForCheck();
  }

  async cargarLogo() {
    try {
      this.logoBase64 = (await this.electronService.cargarLogo('logo.jpg')) || '';
    } catch (error) {
      console.error('Error cargando logo:', error);
    }
  }

  inicializarFirmas() {
    this.inicializarCanvas(this.canvasFirma, (pad) => (this.signaturePad = pad));
    if (this.esMenor) {
      setTimeout(() => {
        this.inicializarCanvas(this.canvasFirmaAcudiente, (pad) => (this.signaturePadAcudiente = pad));
      }, 50);
    }
  }

  inicializarCanvas(ref: ElementRef, callback: (pad: SignaturePad) => void) {
    if (!ref) return;
    const canvas = ref.nativeElement;
    const ratio = window.devicePixelRatio || 1;

    const ancho = 560;
    const alto = 220;
    canvas.width = ancho * ratio;
    canvas.height = alto * ratio;
    canvas.style.width = `${ancho}px`;
    canvas.style.height = `${alto}px`;

    // CRÍTICO para Wacom: permite que el stylus dibuje sin que
    // el navegador/Electron intercepte los eventos de puntero
    canvas.style.touchAction = 'none';
    canvas.style.msTouchAction = 'none';
    canvas.style.userSelect = 'none';

    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);

    const pad = new SignaturePad(canvas, {
      minWidth: 0.8,
      maxWidth: 3.5,
      throttle: 0,
      velocityFilterWeight: 0.5,
      penColor: 'rgb(0, 0, 180)',
    });

    // Wacom usa Pointer Events (no mouse events).
    // signature_pad los soporta pero Electron a veces los bloquea.
    // Forzamos el manejo manual como respaldo:
    let dibujando = false;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / ratio / rect.width;
      const scaleY = canvas.height / ratio / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      // Solo stylus (pointerType 'pen') o mouse — ignorar touch duplicado
      if (e.pointerType === 'touch') return;
      canvas.setPointerCapture(e.pointerId);
      dibujando = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (!dibujando || e.pointerType === 'touch') return;
      const pos = getPos(e);
      const presion = e.pressure > 0 ? e.pressure : 0.5;
      ctx.lineWidth = 0.8 + presion * 2.7; // Varía entre 0.8 y 3.5 según presión
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgb(0, 0, 180)';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    });

    const terminarTrazo = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      dibujando = false;
    };

    canvas.addEventListener('pointerup', terminarTrazo);
    canvas.addEventListener('pointerleave', terminarTrazo);
    canvas.addEventListener('pointercancel', terminarTrazo);

    callback(pad);
  }

  ngAfterViewInit() {
    this.inicializarCanvas(this.canvasFirma, (pad) => (this.signaturePad = pad));
  }

  // Cuando el checkbox cambia, inicializa el canvas del acudiente
  onEsMenorChange() {
    this.firmaAcudienteGuardada = '';
    if (this.esMenor) {
      setTimeout(() => {
        this.inicializarCanvas(
          this.canvasFirmaAcudiente,
          (pad) => (this.signaturePadAcudiente = pad)
        );
      }, 100);
    }
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

  limpiarFirma() {
    this.signaturePad?.clear();
    // Limpiar también el canvas directo (trazos de Wacom)
    const canvas = this.canvasFirma?.nativeElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    this.firmaGuardada = '';
    this.cdr.markForCheck();
  }

  limpiarFirmaAcudiente() {
    this.signaturePadAcudiente?.clear();
    const canvas = this.canvasFirmaAcudiente?.nativeElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    this.firmaAcudienteGuardada = '';
    this.cdr.markForCheck();
  }

  private canvasEstaVacio(canvasRef: ElementRef): boolean {
    // Verifica píxeles reales en el canvas, no solo el estado de signature_pad
    // Esto es necesario porque el dibujo manual para Wacom no actualiza
    // el estado interno de signature_pad
    const canvas = canvasRef?.nativeElement;
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    const datos = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // Si algún píxel tiene alpha > 0, hay contenido
    for (let i = 3; i < datos.length; i += 4) {
      if (datos[i] > 0) return false;
    }
    return true;
  }

  guardarFirma() {
    const vacio = this.signaturePad.isEmpty() && this.canvasEstaVacio(this.canvasFirma);
    if (vacio) {
      this.mostrarMensaje('El paciente debe firmar primero', 'error');
      return;
    }
    this.firmaGuardada = this.canvasFirma.nativeElement.toDataURL('image/png');
    this.mostrarMensaje('✅ Firma del paciente guardada');
    this.cdr.markForCheck();
  }

  guardarFirmaAcudiente() {
    const vacio = (!this.signaturePadAcudiente || this.signaturePadAcudiente.isEmpty())
                  && this.canvasEstaVacio(this.canvasFirmaAcudiente);
    if (vacio) {
      this.mostrarMensaje('El acudiente debe firmar primero', 'error');
      return;
    }
    this.firmaAcudienteGuardada = this.canvasFirmaAcudiente.nativeElement.toDataURL('image/png');
    this.mostrarMensaje('✅ Firma del acudiente guardada');
    this.cdr.markForCheck();
  }

  seleccionarGrupo(grupo: string) {
    this.consentimiento.grupoPlantilla = grupo;
    this.plantillasFiltradas = this.plantillas.filter((p: any) => p.grupo === grupo);
    this.consentimiento.plantilla = '';
  }

  // ========================
  // VALIDACIONES
  // ========================
  private validarFormulario(): boolean {
    const plantillaSeleccionada = this.plantillas.find(
      (p: any) => p.nombre === this.consentimiento.plantilla
    );

    if (!plantillaSeleccionada) {
      this.mostrarMensaje('Debe seleccionar una plantilla', 'error');
      return false;
    }

    if (!this.firmaGuardada && this.signaturePad.isEmpty()) {
      this.mostrarMensaje('El paciente debe firmar primero', 'error');
      return false;
    }

    if (this.esMenor) {
      if (!this.acudiente.nombre || !this.acudiente.documento || !this.acudiente.parentesco) {
        this.mostrarMensaje('Completa los datos del acudiente', 'error');
        return false;
      }
      if (!this.firmaAcudienteGuardada && (!this.signaturePadAcudiente || this.signaturePadAcudiente.isEmpty())) {
        this.mostrarMensaje('El acudiente debe firmar también', 'error');
        return false;
      }
    }

    return true;
  }

  // ========================
  // GENERAR PDF
  // ========================
  async generarConsentimiento() {
    if (!this.signaturePad.isEmpty()) {
      this.firmaGuardada = this.signaturePad.toDataURL();
    }
    if (this.esMenor && this.signaturePadAcudiente && !this.signaturePadAcudiente.isEmpty()) {
      this.firmaAcudienteGuardada = this.signaturePadAcudiente.toDataURL();
    }

    if (!this.validarFormulario()) return;

    const medicoSeleccionado = this.medicos.find((m: any) => m.nombre === this.consentimiento.medico);
    const enfermeroSeleccionado = this.enfermeros.find((e: any) => e.nombre === this.consentimiento.enfermero);
    const plantillaSeleccionada = this.plantillas.find((p: any) => p.nombre === this.consentimiento.plantilla);

    try {
      await this.electronService.crearConsentimiento({
        pacienteId: this.paciente.id,
        medicoId: medicoSeleccionado?.id || null,
        enfermeroId: enfermeroSeleccionado?.id || null,
        plantillaId: plantillaSeleccionada.id,
        fecha: this.consentimiento.fecha,
        firmaPaciente: this.firmaGuardada,
        esMenor: this.esMenor ? 1 : 0,
        acudienteNombre: this.esMenor ? this.acudiente.nombre : null,
        acudienteDocumento: this.esMenor ? this.acudiente.documento : null,
        acudienteParentesco: this.esMenor ? this.acudiente.parentesco : null,
        firmaAcudiente: this.esMenor ? this.firmaAcudienteGuardada : null,
      });

      this.consentimientos = await this.electronService.obtenerConsentimientos(this.documento);
      this.mostrarMensaje('✅ Consentimiento guardado correctamente');
    } catch (error) {
      this.mostrarMensaje('Error al guardar el consentimiento', 'error');
      return;
    }

    this.construirYDescargarPDF(plantillaSeleccionada, medicoSeleccionado, enfermeroSeleccionado);
  }

  private construirYDescargarPDF(plantilla: any, medico: any, enfermero: any) {
    const codigo = plantilla?.codigo || '';
    const version = plantilla?.version || '';
    const fechaPlantilla = plantilla?.fecha || '';

    let texto = plantilla?.contenido || '';
    texto = texto
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    texto = texto
      .replaceAll('{{paciente.nombre}}', this.paciente.nombre)
      .replaceAll('{{paciente.numeroDocumento}}', this.paciente.numeroDocumento)
      .replaceAll('{{medico}}', this.consentimiento.medico)
      .replaceAll('{{enfermero}}', this.consentimiento.enfermero)
      .replaceAll('{{fecha}}', this.consentimiento.fecha)
      .replaceAll('{{paciente.lugarExpedicion}}', this.paciente.lugarExpedicion || '');

    const parrafos = this.procesarContenido(texto);

    // Firmas
    const imgPaciente = this.firmaGuardada
      ? [{ image: this.firmaGuardada, width: 80, height: 40 }]
      : [{ text: '' }];

    const imgMedico = medico?.firma
      ? [{ image: medico.firma, width: 80, height: 40 }]
      : [{ text: '' }];

    const imgEnfermero = enfermero?.firma
      ? [{ image: enfermero.firma, width: 80, height: 40 }]
      : [{ text: '' }];

    const imgAcudiente = this.firmaAcudienteGuardada
      ? [{ image: this.firmaAcudienteGuardada, width: 80, height: 40 }]
      : [{ text: '' }];

    // Columna firma médico (opcional)
    const columnasMedico = this.consentimiento.medico
      ? [{
          width: '40%',
          stack: [
            ...imgMedico,
            { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 150, y2: 5, lineWidth: 1 }] },
            { text: 'Firma del médico', style: 'firmaLabel' },
            { text: medico?.nombre || '', fontSize: 9, marginTop: 2 },
            { text: `C.C. ${medico?.cedula || ''}`, fontSize: 9 },
            { text: `Reg. ${medico?.registromedico || ''}`, fontSize: 9 },
          ],
        }]
      : [];

    // Columna firma enfermero (opcional)
    const columnasEnfermero = this.consentimiento.enfermero
      ? [{
          width: '40%',
          stack: [
            ...imgEnfermero,
            { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 150, y2: 5, lineWidth: 1 }] },
            { text: 'Firma del enfermero', style: 'firmaLabel' },
            { text: enfermero?.nombre || '', fontSize: 9, marginTop: 2 },
            { text: `C.C. ${enfermero?.documentoenfermero || ''}`, fontSize: 9 },
          ],
        }]
      : [];

    // Sección de firmas del paciente
    const seccionFirmaPaciente: any = {
      marginTop: 30,
      columns: [
        {
          width: '40%',
          stack: [
            ...imgPaciente,
            { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 150, y2: 5, lineWidth: 1 }] },
            { text: 'Firma del paciente', style: 'firmaLabel' },
            { text: this.paciente.nombre || '', fontSize: 9, marginTop: 2 },
            { text: `C.C. ${this.paciente.numeroDocumento || ''}`, fontSize: 9 },
          ],
        },
        { width: '*', text: '' },
        ...columnasMedico,
      ],
    };

    // Sección firma acudiente (solo si es menor)
    const seccionFirmaAcudiente: any[] = this.esMenor
      ? [{
          marginTop: 30,
          columns: [
            {
              width: '40%',
              stack: [
                ...imgAcudiente,
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 150, y2: 5, lineWidth: 1 }] },
                { text: 'Firma del acudiente', style: 'firmaLabel' },
                { text: this.acudiente.nombre || '', fontSize: 9, marginTop: 2 },
                { text: `C.C. ${this.acudiente.documento || ''}`, fontSize: 9 },
                { text: `Parentesco: ${this.acudiente.parentesco || ''}`, fontSize: 9 },
              ],
            },
            { width: '*', text: '' },
            ...columnasEnfermero,
          ],
        }]
      : columnasEnfermero.length > 0
        ? [{ marginTop: 30, columns: [{ width: '*', text: '' }, ...columnasEnfermero, { width: '*', text: '' }] }]
        : [];

    const docDefinition: any = {
      pageMargins: [40, 40, 40, 60],
      content: [
        // Encabezado
        {
          table: {
            widths: ['30%', '*', '25%'],
            body: [[
              {
                stack: this.logoBase64
                  ? [{ image: this.logoBase64, width: 130, height: 60, alignment: 'center' }]
                  : [{ text: '' }],
                border: [true, true, true, true],
              },
              {
                stack: [
                  { text: 'DHI COLOMBIA – BARRANQUILLA S.A.S', style: 'headerCenter' },
                  { text: 'DIRECCIÓN MEDICA', style: 'headerCenter' },
                  { text: 'CONSENTIMIENTO INFORMADO', style: 'headerCenter' },
                  { text: plantilla.nombre, style: 'headerCenter' },
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

        // Nota si es menor de edad
        ...(this.esMenor ? [{
          text: `PACIENTE MENOR DE EDAD — Acudiente: ${this.acudiente.nombre} (${this.acudiente.parentesco}) · Doc: ${this.acudiente.documento}`,
          fontSize: 9,
          bold: true,
          color: '#555555',
          marginBottom: 10,
          alignment: 'center',
        }] : []),

        // Contenido de la plantilla
        ...parrafos,

        // Firmas
        seccionFirmaPaciente,
        ...seccionFirmaAcudiente,
      ],

      styles: {
        headerCenter: { fontSize: 10, bold: true, alignment: 'center', lineHeight: 1.4 },
        headerRight: { fontSize: 9, alignment: 'left', lineHeight: 1.4 },
        body: { fontSize: 11, lineHeight: 1.5 },
        firmaLabel: { fontSize: 10, marginTop: 4 },
      },
    };

    pdfMake
      .createPdf(docDefinition)
      .download(`consentimiento-${this.paciente.nombre}-${this.paciente.numeroDocumento}.pdf`);
  }

  // ========================
  // PARSEO DE CONTENIDO
  // ========================
  procesarContenido(texto: string): any[] {
    const bloques: any[] = [];
    const partes = texto.split('[TABLA_SINO]');

    partes.forEach((parte: string) => {
      if (parte.includes('[/TABLA_SINO]')) {
        const [contenidoTabla, restoTexto] = parte.split('[/TABLA_SINO]');
        const filas = contenidoTabla
          .split('\n')
          .filter((l: string) => l.trim() !== '')
          .map((linea: string) => {
            const celdas = linea.split(';').map((p: string) => p.trim());
            return [
              { text: celdas[0] || '', fontSize: 10, border: [false, false, false, false] },
              { text: celdas[1]?.toLowerCase() === 'x' ? 'X' : '___', fontSize: 10, alignment: 'center', border: [false, false, false, false] },
              { text: celdas[2]?.toLowerCase() === 'x' ? 'X' : '___', fontSize: 10, alignment: 'center', border: [false, false, false, false] },
            ];
          });

        bloques.push({
          marginBottom: 10, marginTop: 5,
          table: {
            widths: ['*', 50, 50],
            body: [
              [
                { text: '', border: [false, false, false, false] },
                { text: 'SI', fontSize: 10, bold: true, alignment: 'center', border: [false, false, false, false] },
                { text: 'NO', fontSize: 10, bold: true, alignment: 'center', border: [false, false, false, false] },
              ],
              ...filas,
            ],
          },
        });

        if (restoTexto?.trim()) {
          restoTexto.split('\n').filter((p: string) => p.trim() !== '').forEach((p: string) => {
            bloques.push(this.parsearParrafo(p));
          });
        }
      } else {
        parte.split('\n').filter((p: string) => p.trim() !== '').forEach((p: string) => {
          bloques.push(this.parsearParrafo(p));
        });
      }
    });

    return bloques;
  }

  parsearParrafo(texto: string): any {
    const partes = texto.split(/(\[B\].*?\[\/B\])/g);
    if (partes.length === 1) {
      return { text: texto.trim().replace(/\s+/g, ' '), style: 'body', alignment: 'justify', marginBottom: 10 };
    }
    return {
      text: partes.map((parte: string) =>
        parte.startsWith('[B]') && parte.endsWith('[/B]')
          ? { text: parte.replace('[B]', '').replace('[/B]', '').trim(), bold: true }
          : { text: parte }
      ),
      style: 'body', alignment: 'justify', marginBottom: 10,
    };
  }

  // ========================
  // VER CONSENTIMIENTO GUARDADO
  // ========================
  verConsentimiento(c: any) {
    const firmasPaciente = c.firmaPaciente
      ? [{ image: c.firmaPaciente, width: 80, height: 40 }]
      : [{ text: '' }];

    const firmasAcudiente = c.firmaAcudiente
      ? [{ image: c.firmaAcudiente, width: 80, height: 40 }]
      : [{ text: '' }];

    const seccionAcudiente: any[] = c.esMenor
      ? [{
          marginTop: 20,
          columns: [{
            width: '40%',
            stack: [
              ...firmasAcudiente,
              { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 150, y2: 5, lineWidth: 1 }] },
              { text: 'Firma del acudiente', fontSize: 10, marginTop: 4 },
              { text: c.acudienteNombre || '', fontSize: 9 },
              { text: `C.C. ${c.acudienteDocumento || ''}`, fontSize: 9 },
              { text: `Parentesco: ${c.acudienteParentesco || ''}`, fontSize: 9 },
            ],
          }],
        }]
      : [];

    const docDefinition: any = {
      pageMargins: [40, 40, 40, 60],
      content: [
        {
          table: {
            widths: ['30%', '*', '25%'],
            body: [[
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
                  { text: `Código: ${c.codigo || ''}`, style: 'headerRight' },
                  { text: `Versión: ${c.version || ''}`, style: 'headerRight' },
                  { text: `Fecha: ${c.fechaPlantilla || ''}`, style: 'headerRight' },
                  { text: 'Página: 1', style: 'headerRight' },
                ],
                border: [true, true, true, true],
              },
            ]],
          },
          layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#000000', vLineColor: () => '#000000' },
          marginBottom: 16,
        },
        ...(c.esMenor ? [{
          text: `PACIENTE MENOR DE EDAD — Acudiente: ${c.acudienteNombre} (${c.acudienteParentesco}) · Doc: ${c.acudienteDocumento}`,
          fontSize: 9, bold: true, color: '#555555', marginBottom: 10, alignment: 'center',
        }] : []),
        { text: c.contenido || '', fontSize: 11, alignment: 'justify', lineHeight: 1.5, marginBottom: 30 },
        {
          marginTop: 30,
          columns: [{
            width: '40%',
            stack: [
              ...firmasPaciente,
              { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 150, y2: 5, lineWidth: 1 }] },
              { text: 'Firma del paciente', fontSize: 10, marginTop: 4 },
            ],
          }],
        },
        ...seccionAcudiente,
      ],
      styles: {
        headerCenter: { fontSize: 10, bold: true, alignment: 'center', lineHeight: 1.4 },
        headerRight: { fontSize: 9, alignment: 'left', lineHeight: 1.4 },
      },
    };

    pdfMake.createPdf(docDefinition).download(`consentimiento-${c.numeroDocumento}.pdf`);
  }

  async eliminarConsentimiento(id: number) {
    try {
      await this.electronService.eliminarConsentimiento(id);
      this.consentimientos = await this.electronService.obtenerConsentimientos(this.documento);
      this.mostrarMensaje('✅ Consentimiento eliminado');
      this.cdr.markForCheck();
    } catch (error) {
      this.mostrarMensaje('Error al eliminar el consentimiento', 'error');
    }
  }
}