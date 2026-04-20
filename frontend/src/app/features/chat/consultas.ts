import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { finalize, timeout, catchError, of } from 'rxjs';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-background flex flex-col items-center py-12 px-4 selection:bg-secondary/20">
      
      <!-- Header -->
      <header class="w-full max-w-2xl text-center mb-8 relative">
        <div class="absolute -top-8 right-0 font-sans text-[8px] opacity-20 tracking-widest">VER. 1.0.4</div>
        <span class="font-sans text-[10px] uppercase tracking-[0.3em] text-secondary font-bold">The Heritage Archive</span>
        <h1 class="font-serif text-5xl text-primary mt-4 font-bold tracking-tight">Consultas al Archivo</h1>
        <p class="font-serif italic text-on-surface-variant mt-4 opacity-70">Pregunte sobre la historia, fundaciones y secretos de las bodegas del Marco de Jerez.</p>
        <div class="h-px w-24 bg-secondary/30 mx-auto mt-8"></div>
      </header>

      <!-- Chat Container -->
      <main class="w-full max-w-3xl h-[600px] flex flex-col bg-white/40 backdrop-blur-sm border border-outline/5 shadow-2xl relative overflow-hidden">
        
        <!-- Messages Area -->
        <div #scrollContainer class="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth custom-scrollbar">
          
          <div *ngFor="let msg of messages" 
               [ngClass]="{'items-end': msg.role === 'user', 'items-start': msg.role === 'assistant'}"
               class="flex flex-col gap-2 group animate-fade-in">
            
            <!-- Message Label -->
            <span class="font-sans text-[9px] uppercase tracking-widest font-bold opacity-40 group-hover:opacity-100 transition-opacity"
                  [ngClass]="{'text-right': msg.role === 'user'}">
              {{ msg.role === 'user' ? 'Investigador' : 'Archivero Regional' }}
            </span>

            <!-- Bubble -->
            <div [ngClass]="{
                   'bg-primary text-white shadow-lg': msg.role === 'user',
                   'bg-[#FDFDF0] border border-outline/10 text-primary shadow-sm': msg.role === 'assistant'
                 }"
                 class="max-w-[85%] p-5 text-sm leading-relaxed font-serif relative">
              
              <!-- Content -->
              <p class="whitespace-pre-wrap">{{ msg.content }}</p>
              
              <!-- Decorative corner for assistant -->
              <div *ngIf="msg.role === 'assistant'" class="absolute -left-1 -top-1 w-2 h-2 border-l border-t border-secondary/30"></div>
              <div *ngIf="msg.role === 'assistant'" class="absolute -right-1 -bottom-1 w-2 h-2 border-r border-b border-secondary/30"></div>
            </div>

            <!-- Timestamp -->
            <span class="font-sans text-[8px] opacity-30">{{ msg.timestamp | date:'HH:mm' }}</span>
          </div>

          <!-- Loading Indicator -->
          <div *ngIf="loading" class="flex flex-col gap-2 items-start animate-fade-in">
            <span class="font-sans text-[9px] uppercase tracking-widest font-bold opacity-40">Archivero buscando...</span>
            <div class="bg-[#FDFDF0] border border-outline/10 p-4 border-radius-sm shadow-sm flex items-center gap-2">
              <div class="flex gap-1.5 items-center px-1">
                <div class="w-1.5 h-1.5 bg-secondary rounded-full animate-typing-dot"></div>
                <div class="w-1.5 h-1.5 bg-secondary rounded-full animate-typing-dot [animation-delay:0.2s]"></div>
                <div class="w-1.5 h-1.5 bg-secondary rounded-full animate-typing-dot [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <footer class="p-6 bg-white/60 border-t border-outline/5 backdrop-blur-md">
          <form (ngSubmit)="sendMessage()" class="flex gap-4">
            <input [(ngModel)]="userInput" 
                   name="userInput"
                   [disabled]="loading"
                   placeholder="Escriba su consulta aquí... (ej: ¿Qué bodega se fundó en 1835?)" 
                   class="flex-1 bg-transparent border-0 border-b border-outline/20 py-4 font-serif text-primary focus:ring-0 focus:border-secondary transition-all placeholder:text-outline/30 placeholder:italic"
                   type="text" 
                   autocomplete="off" />
            
            <button type="submit" 
                    [disabled]="loading || !userInput.trim()"
                    class="bg-primary text-white px-8 font-sans text-xs uppercase font-bold tracking-[0.2em] hover:bg-secondary disabled:opacity-30 disabled:grayscale transition-all duration-500 flex items-center gap-2">
              <span class="hidden md:inline">Consultar</span>
              <span class="material-symbols-outlined text-sm">send</span>
            </button>
          </form>
          <p class="mt-4 font-sans text-[9px] text-center text-on-surface-variant/40 tracking-wider">RESPUESTAS GENERADAS POR EL ARCHIVO HISTÓRICO AUTOMATIZADO</p>
        </footer>

      </main>

      <!-- Back Link -->
      <footer class="mt-12">
        <a href="/" class="font-sans text-[10px] uppercase font-bold tracking-widest text-secondary hover:text-primary transition-colors flex items-center gap-2">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Volver al Inicio
        </a>
      </footer>

    </div>
  `,
  styles: [`
    :host { display: block; }
    
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-typing-dot {
      animation: typingDot 1.4s infinite ease-in-out;
    }

    @keyframes typingDot {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1.1); opacity: 1; }
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(42, 0, 2, 0.1);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(42, 0, 2, 0.3);
    }
  `]
})
export class ConsultasComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
  private chatService = inject(ChatService);
  
  messages: Message[] = [];
  userInput = '';
  loading = false;

  ngOnInit() {
    console.log('📦 Versión del Sistema de Consultas: 1.0.4');
    this.initChat();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private initChat() {
    this.loading = true;
    console.log('📡 Iniciando chat con sesión:', this.chatService.getSessionId());
    
    this.chatService.initializeChat().pipe(
      timeout(15000), // 15s safety timeout
      finalize(() => {
        this.loading = false;
        console.log('🏁 Proceso de inicialización finalizado.');
      })
    ).subscribe({
      next: (res) => {
        console.log('✅ Chat inicializado con éxito:', res);
        this.messages = [...this.messages, {
          role: 'assistant',
          content: 'Bienvenido al Archivo Histórico de las Bodegas del Marco de Jerez. He revisado los registros y estoy listo para asistirle en su investigación. ¿Sobre qué bodega o suceso histórico desea consultar hoy?',
          timestamp: new Date()
        }];
      },
      error: (err) => {
        console.error('❌ Error de inicialización:', err);
        this.messages.push({
          role: 'assistant',
          content: 'Sin embargo, hay un problema de conexión con los legajos físicos. Por favor, asegúrese de que el sistema de archivo esté encendido e intente recargar la página.',
          timestamp: new Date()
        });
      }
    });
  }

  sendMessage() {
    if (!this.userInput.trim() || this.loading) return;

    const userMsg = this.userInput.trim();
    this.messages.push({
      role: 'user',
      content: userMsg,
      timestamp: new Date()
    });

    this.userInput = '';
    this.loading = true;
    console.log('✉️ Enviando mensaje...');

    this.chatService.sendMessage(userMsg).pipe(
      timeout(35000), // 35s safety timeout (n8n + LLM)
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
        console.log('📩 Respuesta recibida:', res);
        if (res.success && res.data && res.data.respuesta) {
          this.messages = [...this.messages, {
            role: 'assistant',
            content: res.data.respuesta,
            timestamp: new Date()
          }];
        }
      },
      error: (err) => {
        console.error('❌ Error enviando mensaje:', err);
        this.messages = [...this.messages, {
          role: 'assistant',
          content: 'Lo lamento, no he podido recuperar ese legajo en este momento. Por favor, repita la consulta.',
          timestamp: new Date()
        }];
      }
    });
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
