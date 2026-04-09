import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-md">
      <div class="bg-white p-12 max-w-md w-full shadow-2xl border border-outline/10 text-center space-y-8">
        <div class="space-y-6">
          <span class="material-symbols-outlined text-4xl text-secondary">key</span>
          <h2 class="font-serif text-3xl text-primary font-bold italic">Verificar Código</h2>
          <p class="font-sans text-sm text-on-surface-variant">Hemos enviado un código de 6 dígitos a {{ email }}.</p>
          
          <div class="flex flex-col gap-2 text-left">
            <label class="font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider" for="auth-code">Código de 6 dígitos</label>
            <input 
              [(ngModel)]="code"
              class="border-0 border-b border-outline/20 bg-transparent py-3 focus:ring-0 focus:border-secondary transition-colors text-primary font-medium text-center tracking-[0.5em] text-xl" 
              id="auth-code" 
              type="text" 
              maxlength="6" 
              placeholder="000000" />
          </div>
          
          <button 
            (click)="onVerify()"
            [disabled]="loading"
            class="w-full bg-primary text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-secondary transition-all disabled:opacity-50">
            {{ loading ? 'Verificando...' : 'Acceder' }}
          </button>
          
          <button 
            routerLink="/login"
            class="text-[10px] uppercase tracking-widest font-bold text-secondary hover:text-primary transition-colors">
            Volver a introducir email
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class VerifyComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  code = '';
  loading = false;

  ngOnInit() {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    if (!this.email) {
      this.router.navigate(['/login']);
    }
  }

  onVerify() {
    if (!this.code || this.code.length !== 6) return;
    this.loading = true;

    this.authService.verifyCode(this.email, this.code).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/form']);
        }
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
