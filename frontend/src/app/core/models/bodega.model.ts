export interface Bodega {
  id?: number;
  user_id?: number;
  nombre: string;
  direccion: string | null;
  poblacion: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  web: string | null;
  url_maps: string | null;
  horario: string | null;
  descripcion: string | null;
  visitas: boolean;
  pdf_path: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BodegaResponse {
  success: boolean;
  message?: string;
  data: Bodega | null;
}
