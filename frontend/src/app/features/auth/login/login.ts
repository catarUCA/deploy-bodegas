import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-md">
      <div class="bg-white p-12 max-w-md w-full shadow-2xl border border-outline/10 text-center space-y-8">
        <div class="space-y-6">
          <span class="material-symbols-outlined text-4xl text-secondary">lock_person</span>
          <h2 class="font-serif text-3xl text-primary font-bold italic">Acceso al Archivo</h2>
          <p class="font-sans text-sm text-on-surface-variant">Introduce tu email para recibir un código de acceso único.</p>
          
          <div class="flex flex-col gap-2 text-left">
            <label class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" for="auth-email">Email</label>
            <input 
              [(ngModel)]="email"
              class="border-0 border-b border-outline/20 bg-transparent py-3 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium" 
              id="auth-email" 
              type="email" 
              placeholder="tu@email.com" />
          </div>
          
            <button 
              (click)="onRequestCode()"
              [disabled]="loading"
              class="w-full bg-primary text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-secondary transition-all disabled:opacity-50">
              {{ loading ? 'Enviando...' : 'Enviar Código' }}
            </button>
            
            <div *ngIf="errorMessage" class="text-error text-xs font-medium p-3 bg-error/10 border border-error/20">
              {{ errorMessage }}
            </div>
          </div>
        </div>
      </div>
    `,
    styles: [`
      :host { display: block; }
    `]
  })
  export class LoginComponent {
    private authService = inject(AuthService);
    private router = inject(Router);
  
    email = '';
    loading = false;
    errorMessage = '';

  async onRequestCode() {
    if (!this.email) return;
    this.loading = true;
    this.errorMessage = '';

    import('rxjs').then(({ finalize }) => {
      this.authService.requestCode(this.email).pipe(
        finalize(() => this.loading = false)
      ).subscribe({
        next: (res) => {
          if (res.success) {
            this.router.navigate(['/verify'], { queryParams: { email: this.email } });
          } else {
            this.errorMessage = res.message || 'Error al solicitar el código.';
          }
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err.error?.message || 'Error de conexión. Inténtalo de nuevo.';
        }
      });
    });
  }
}
