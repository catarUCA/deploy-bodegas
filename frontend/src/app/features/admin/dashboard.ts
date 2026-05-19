import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService, DashboardRow } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-background">
      <button (click)="onLogout()" class="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-outline/10 text-secondary font-sans text-[10px] uppercase font-bold tracking-widest hover:bg-secondary hover:text-white transition-all shadow-sm">
        <span class="material-symbols-outlined text-sm">logout</span>
        Cerrar Sesión
      </button>

      <section class="py-24 px-6 lg:px-12">
        <div class="max-w-5xl mx-auto">
          <div class="mb-16 text-center">
            <span class="font-sans text-[10px] uppercase tracking-[0.2em] text-secondary font-bold">Panel de Administración</span>
            <h2 class="font-serif text-4xl text-primary mt-4 font-bold">Censo de Bodegas</h2>
          </div>

          <div *ngIf="error" class="mb-8 p-4 font-sans text-sm font-medium border text-center bg-error/10 border-error text-error">
            {{ error }}
          </div>

          <div *ngIf="loading" class="text-center py-16">
            <div class="flex gap-1.5 items-center justify-center px-1">
              <div class="w-1.5 h-1.5 bg-secondary rounded-full animate-typing-dot"></div>
              <div class="w-1.5 h-1.5 bg-secondary rounded-full animate-typing-dot [animation-delay:0.2s]"></div>
              <div class="w-1.5 h-1.5 bg-secondary rounded-full animate-typing-dot [animation-delay:0.4s]"></div>
            </div>
          </div>

          <div *ngIf="!loading && !error" class="bg-white shadow-sm border border-outline/5">
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="border-b border-outline/10">
                    <th class="px-6 py-4 font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Email</th>
                    <th class="px-6 py-4 font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Bodega</th>
                    <th class="px-6 py-4 font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">PDF</th>
                    <th class="px-6 py-4 font-sans text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Última Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of rows" class="border-b border-outline/5 hover:bg-surface-container/50 transition-colors">
                    <td class="px-6 py-4 font-sans text-sm text-primary">{{ row.email }}</td>
                    <td class="px-6 py-4">
                      <span *ngIf="row.has_bodega" class="font-sans text-sm text-primary">{{ row.nombre }}</span>
                      <span *ngIf="!row.has_bodega" class="font-sans text-xs text-error opacity-60">Pendiente</span>
                    </td>
                    <td class="px-6 py-4">
                      <span *ngIf="row.has_pdf" class="inline-flex items-center gap-1 font-sans text-xs font-medium text-secondary">
                        <span class="material-symbols-outlined text-sm">check_circle</span>
                        Sí
                      </span>
                      <span *ngIf="!row.has_pdf && row.has_bodega" class="inline-flex items-center gap-1 font-sans text-xs text-on-surface-variant/50">
                        <span class="material-symbols-outlined text-sm">remove_circle</span>
                        No
                      </span>
                      <span *ngIf="!row.has_bodega" class="font-sans text-xs text-on-surface-variant/30">—</span>
                    </td>
                    <td class="px-6 py-4 font-sans text-xs text-on-surface-variant">
                      {{ row.bodega_updated_at ? (row.bodega_updated_at | date:'dd/MM/yyyy HH:mm') : '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div *ngIf="rows.length === 0" class="text-center py-16 font-sans text-sm text-on-surface-variant/50">
              No hay usuarios registrados todavía.
            </div>
          </div>

          <div class="mt-8 flex justify-center">
            <a routerLink="/form" class="font-sans text-[10px] uppercase font-bold tracking-widest text-secondary hover:text-primary transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              Volver al Formulario
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-typing-dot {
      animation: typingDot 1.4s infinite ease-in-out;
    }
    @keyframes typingDot {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1.1); opacity: 1; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);

  rows: DashboardRow[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.adminService.getDashboard().subscribe({
      next: (res: { success: boolean; data: DashboardRow[] }) => {
        if (res.success) {
          this.rows = res.data;
        }
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 403) {
          this.error = 'Acceso denegado. No tienes permisos de administrador.';
        } else {
          this.error = 'Error al cargar los datos del dashboard.';
        }
      }
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
