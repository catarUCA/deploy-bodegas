import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BodegaService } from '../../../core/services/bodega.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-bodega-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-background">
      <button (click)="onLogout()" class="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-outline/10 text-secondary font-sans text-[10px] uppercase font-bold tracking-widest hover:bg-secondary hover:text-white transition-all shadow-sm">
        <span class="material-symbols-outlined text-sm">logout</span>
        Cerrar Sesión
      </button>

      <!-- Registration Form Section -->
      <section class="py-24 px-6 lg:px-24">
        <div class="max-w-3xl mx-auto">
          <div class="mb-16 text-center">
            <span class="font-sans text-[10px] uppercase tracking-[0.2em] text-secondary font-bold">Formulario de Inscripción</span>
            <h2 class="font-serif text-4xl text-primary mt-4 font-bold">Censo de Bodegas</h2>
          </div>
          
          <div class="bg-white p-8 md:p-12 shadow-sm border border-outline/5">
            <form [formGroup]="bodegaForm" (ngSubmit)="onSubmit()" class="space-y-12">
              
              <!-- Identidad -->
              <div class="space-y-8">
                <h3 class="font-serif text-xl text-primary flex items-center gap-3">
                  <span class="material-symbols-outlined text-secondary">domain</span>
                  Identidad de la Bodega
                </h3>
                <div class="grid grid-cols-1 gap-8">
                  <div class="flex flex-col gap-2">
                    <label class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" for="winery_name">Nombre de la Bodega *</label>
                    <input formControlName="winery_name" class="border-0 border-b border-outline/20 bg-transparent py-3 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium placeholder:text-outline/30" id="winery_name" placeholder="Ej: Bodegas del Siglo" type="text" />
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="flex flex-col gap-2">
                      <label class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" for="winery_city">Ciudad / Población</label>
                      <input formControlName="winery_city" class="border-0 border-b border-outline/20 bg-transparent py-3 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium placeholder:text-outline/30" id="winery_city" placeholder="Ej: Laguardia" type="text" />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" for="winery_province">Provincia</label>
                      <input formControlName="winery_province" class="border-0 border-b border-outline/20 bg-transparent py-3 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium placeholder:text-outline/30" id="winery_province" placeholder="Ej: Álava" type="text" />
                    </div>
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" for="winery_address">Dirección Completa</label>
                    <input formControlName="winery_address" class="border-0 border-b border-outline/20 bg-transparent py-3 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium" id="winery_address" type="text" />
                  </div>
                </div>
              </div>

              <!-- Contacto -->
              <div class="space-y-8 pt-4">
                <h3 class="font-serif text-xl text-primary flex items-center gap-3">
                  <span class="material-symbols-outlined text-secondary">contact_mail</span>
                  Contacto y Localización
                </h3>
                <div class="grid grid-cols-1 gap-8">
                  <div class="flex flex-col gap-2">
                    <label class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" for="winery_tel">Teléfono de Contacto</label>
                    <input formControlName="winery_tel" class="border-0 border-b border-outline/20 bg-transparent py-3 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium" id="winery_tel" type="tel" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" for="winery_email">Correo Electrónico</label>
                    <input formControlName="winery_email" class="border-0 border-b border-outline/20 bg-transparent py-3 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium" id="winery_email" type="email" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" for="winery_web">Página Web</label>
                    <input formControlName="winery_web" class="border-0 border-b border-outline/20 bg-transparent py-3 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium" id="winery_web" placeholder="https://www.tu-bodega.com" type="url" />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" for="winery_maps">Enlace Google Maps</label>
                    <input formControlName="winery_maps" class="border-0 border-b border-outline/20 bg-transparent py-3 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium" id="winery_maps" placeholder="https://goo.gl/maps/..." type="url" />
                  </div>
                </div>
              </div>

              <!-- Cronica y Horarios -->
              <div class="space-y-8 pt-4">
                <div class="flex justify-between items-center">
                  <h3 class="font-serif text-xl text-primary flex items-center gap-3">
                    <span class="material-symbols-outlined text-secondary">history_edu</span>
                    Crónica y Horarios
                  </h3>
                  <div class="flex items-center gap-4">
                    <span class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">¿Permite Visitas?</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input formControlName="permite_visitas" class="sr-only peer" type="checkbox" />
                      <div class="w-10 h-5 bg-outline/20 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary">
                      </div>
                    </label>
                  </div>
                </div>
                <div class="grid grid-cols-1 gap-8">
                  <div class="space-y-6">
                    <div *ngFor="let day of days" class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pb-4 border-b border-outline/5 last:border-0 last:pb-0">
                      <div class="col-span-1 md:col-span-2">
                        <span class="font-sans text-[10px] uppercase font-bold text-secondary tracking-[0.2em]">{{ day.label }}</span>
                      </div>
                      <div class="flex flex-col gap-2">
                        <label class="font-sans text-[9px] uppercase font-bold text-on-surface-variant/60 tracking-wider" [for]="day.key + '_manana'">Mañana</label>
                        <input [formControlName]="day.key + '_manana'" class="border-0 border-b border-outline/20 bg-transparent py-2 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium placeholder:text-outline/30 text-sm" [id]="day.key + '_manana'" placeholder="10:00-14:00" type="text" />
                      </div>
                      <div class="flex flex-col gap-2">
                        <label class="font-sans text-[9px] uppercase font-bold text-on-surface-variant/60 tracking-wider" [for]="day.key + '_tarde'">Tarde</label>
                        <input [formControlName]="day.key + '_tarde'" class="border-0 border-b border-outline/20 bg-transparent py-2 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium placeholder:text-outline/30 text-sm" [id]="day.key + '_tarde'" placeholder="17:00-20:00" type="text" />
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" for="winery_description">Breve Descripción / Filosofía</label>
                    <textarea formControlName="winery_description" class="border-0 border-b border-outline/20 bg-transparent py-3 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium resize-none" id="winery_description" placeholder="Describe el alma de tu bodega..." rows="3"></textarea>
                  </div>
                </div>
              </div>

              <!-- Archivo Documental -->
              <div class="space-y-8 pt-4">
                <h3 class="font-serif text-xl text-primary flex items-center gap-3">
                  <span class="material-symbols-outlined text-secondary">upload_file</span>
                  Memoria Documental
                </h3>
                
                <div class="relative group border-2 border-dashed border-outline/20 p-12 text-center hover:border-secondary/50 transition-colors">
                  <input (change)="onFileSelected($event)" accept=".pdf" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id="history_pdf" type="file" />
                  <span class="material-symbols-outlined text-3xl text-outline-variant mb-4 block">picture_as_pdf</span>
                  <p class="font-sans text-sm text-primary font-medium">Sube aquí el documento sobre el origen o crónicas de la bodega</p>
                  <p class="font-sans text-[9px] uppercase tracking-widest text-outline-variant mt-2">Formatos permitidos: PDF (Máx. 100MB)</p>
                </div>

                <!-- Lista de archivos -->
                <div class="space-y-3 px-2">
                  <div *ngFor="let file of selectedFiles; let i = index" class="file-item flex items-center gap-3 p-3 bg-surface-container border border-outline/10 text-primary">
                    <span class="material-symbols-outlined text-secondary">description</span>
                    <div class="flex flex-col min-w-0 flex-1">
                      <span class="font-sans text-xs font-medium truncate">{{ file.name }}</span>
                      <span class="font-sans text-[8px] opacity-50 uppercase">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</span>
                    </div>
                    <button type="button" (click)="removeFile(i)" class="p-1 hover:bg-error/10 hover:text-error rounded-full transition-colors">
                      <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                  
                  <!-- Archivos existentes -->
                  <div *ngIf="existingFiles.length > 0 && selectedFiles.length === 0" class="mt-4">
                    <p class="font-sans text-[10px] uppercase text-secondary font-bold mb-2">Archivos actuales:</p>
                    <div *ngFor="let path of existingFiles" class="flex items-center gap-2 p-2 bg-background text-[10px] font-medium border border-outline/5">
                      <span class="material-symbols-outlined text-sm">picture_as_pdf</span>
                      <span>{{ path.split('/').pop() }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pt-8">
                <button 
                  [disabled]="submitting"
                  class="w-full bg-primary text-white py-5 font-bold uppercase tracking-widest text-sm hover:bg-secondary transition-all duration-500 disabled:opacity-50"
                  type="submit">
                  {{ submitting ? 'Guardando...' : 'ENVIAR AL ARCHIVO HISTÓRICO' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .file-item {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class BodegaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bodegaService = inject(BodegaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  bodegaForm: FormGroup;
  selectedFiles: File[] = [];
  existingFiles: string[] = [];
  submitting = false;
  existingPdfPath: string | null = null;
  days = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  constructor() {
    this.bodegaForm = this.fb.group({
      winery_name: ['', Validators.required],
      winery_city: [''],
      winery_province: [''],
      winery_address: [''],
      winery_tel: [''],
      winery_email: ['', Validators.email],
      winery_web: [''],
      winery_maps: [''],
      winery_description: [''],
      permite_visitas: [false],
      // Schedule fields
      lunes_manana: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      lunes_tarde: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      martes_manana: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      martes_tarde: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      miercoles_manana: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      miercoles_tarde: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      jueves_manana: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      jueves_tarde: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      viernes_manana: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      viernes_tarde: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      sabado_manana: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      sabado_tarde: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      domingo_manana: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]],
      domingo_tarde: ['', [Validators.pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)]]
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.bodegaService.getBodega().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data;
          this.bodegaForm.patchValue({
            winery_name: d.nombre,
            winery_city: d.poblacion,
            winery_province: d.provincia,
            winery_address: d.direccion,
            winery_tel: d.telefono,
            winery_email: d.email,
            winery_web: d.web,
            winery_maps: d.url_maps,
            winery_schedule: d.horario,
            winery_description: d.descripcion,
            permite_visitas: !!d.visitas
          });

          if (d.horario) {
            try {
              const schedule = JSON.parse(d.horario);
              Object.keys(schedule).forEach(day => {
                const lines = schedule[day];
                if (lines[0]) this.bodegaForm.patchValue({ [`${day}_manana`]: lines[0] });
                if (lines[1]) this.bodegaForm.patchValue({ [`${day}_tarde`]: lines[1] });
              });
            } catch (e) {
              console.warn('Could not parse schedule JSON', e);
            }
          }


          if (d.pdf_path) {
            this.existingPdfPath = d.pdf_path;
            try {
              // Handle transition from JSON array to simple string
              const parsed = JSON.parse(d.pdf_path);
              this.existingFiles = Array.isArray(parsed) ? parsed : [parsed];
              // Ensure existingPdfPath is a plain string if it was JSON
              if (Array.isArray(parsed)) this.existingPdfPath = parsed[0];
            } catch (e) {
              this.existingFiles = [d.pdf_path];
            }
          }
        }
      },
      error: (err) => console.error('Error loading data', err)
    });
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files.length > 0) {
      this.selectedFiles = [files[0]];
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onSubmit() {
    if (this.bodegaForm.invalid) return;

    this.submitting = true;
    const formData = new FormData();

    // Append form fields
    Object.keys(this.bodegaForm.value).forEach(key => {
      // Skip structured schedule fields as they will be bundled into winery_schedule
      if (this.days.some(d => key.startsWith(d.key))) return;

      let val = this.bodegaForm.value[key];
      if (key === 'permite_visitas') val = val ? 'on' : 'off';
      formData.append(key, val || '');
    });

    // Bundle schedule into JSON
    const schedule: any = {};
    this.days.forEach(day => {
      const manana = this.bodegaForm.get(`${day.key}_manana`)?.value;
      const tarde = this.bodegaForm.get(`${day.key}_tarde`)?.value;
      const daySchedule = [];
      if (manana) daySchedule.push(manana);
      if (tarde) daySchedule.push(tarde);
      if (daySchedule.length > 0) schedule[day.key] = daySchedule;
    });
    formData.append('winery_schedule', JSON.stringify(schedule));


    // Append files
    this.selectedFiles.forEach(file => {
      formData.append('history_pdf', file);
    });

    // Existing PDF path if no new files
    if (this.existingPdfPath && this.selectedFiles.length === 0) {
      formData.append('existing_pdf_path', this.existingPdfPath);
    }

    this.bodegaService.saveBodega(formData).pipe(
      finalize(() => this.submitting = false)
    ).subscribe({
      next: (res) => {
        if (res.success) {
          alert('¡Bodega guardada con éxito!');
          this.loadData();
          this.selectedFiles = [];
        } else {
          alert(res.message || 'Error al guardar los datos');
        }
      },
      error: (err) => {
        console.error('Error saving data', err);
        alert('Error al conectar con el servidor');
      }
    });
  }
}
