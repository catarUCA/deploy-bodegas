import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardRow {
  user_id: number;
  email: string;
  has_bodega: boolean;
  nombre: string | null;
  has_pdf: boolean;
  bodega_updated_at: string | null;
  user_created_at: string;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardRow[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = '/api/admin';

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard`);
  }
}
