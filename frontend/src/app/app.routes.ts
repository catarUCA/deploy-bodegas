import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { VerifyComponent } from './features/auth/verify/verify';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'form', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'verify', component: VerifyComponent },
  { 
    path: 'form', 
    loadComponent: () => import('./features/bodega/bodega-form/bodega-form').then(m => m.BodegaFormComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'consultas', 
    loadComponent: () => import('./features/chat/consultas').then(m => m.ConsultasComponent)
  },
  { path: '**', redirectTo: 'form' }
];
