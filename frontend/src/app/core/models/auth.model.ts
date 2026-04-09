export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
}

export interface User {
  id: number;
  email: string;
}

export interface LoginCodeRequest {
  email: string;
}

export interface LoginCodeVerify {
  email: string;
  code: string;
}
