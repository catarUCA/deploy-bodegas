import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BodegaResponse } from '../models/bodega.model';

@Injectable({
  providedIn: 'root'
})
export class BodegaService {
  private http = inject(HttpClient);
  private apiUrl = '/api/bodegas';

  getBodega(): Observable<BodegaResponse> {
    return this.http.get<BodegaResponse>(this.apiUrl);
  }

  saveBodega(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }
}
