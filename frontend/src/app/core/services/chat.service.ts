import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = '/api/chat';
  private sessionId: string | null = null;

  constructor() {
    this.refreshSession();
  }

  /**
   * Generates a new session ID for the current visit.
   */
  refreshSession() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      this.sessionId = crypto.randomUUID();
    } else {
      // Fallback para contextos no seguros (HTTP) o navegadores antiguos
      this.sessionId = Math.random().toString(36).substring(2, 11) + 
                       Date.now().toString(36);
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Initializes the conversation context in n8n.
   */
  initializeChat(): Observable<any> {
    return this.http.post(`${this.apiUrl}/init`, {
      id_sesion: this.sessionId
    });
  }

  /**
   * Sends a message to the RAG workflow.
   */
  sendMessage(input: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/message`, {
      id_sesion: this.sessionId,
      input
    });
  }
}
