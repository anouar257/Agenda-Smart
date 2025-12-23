import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaService } from '../../../core/services/agenda.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-smart-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="smart-input-wrapper">
      <div class="smart-input-container">
        <div class="input-glow"></div>
        <div class="smart-input">
          <div class="ai-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          
          <input 
            type="text"
            [(ngModel)]="inputText"
            (keyup.enter)="submitToAI()"
            [disabled]="agenda.isLoading()"
            placeholder="Décrivez votre événement... ex: 'Réunion avec Sarah demain à 14h'"
          >
          
          <button 
            class="submit-btn"
            (click)="submitToAI()"
            [disabled]="!inputText.trim() || agenda.isLoading()"
          >
            <span *ngIf="!agenda.isLoading()">✨</span>
            <span *ngIf="agenda.isLoading()" class="loading-dots">
              <span></span><span></span><span></span>
            </span>
          </button>
        </div>
      </div>
      <p class="helper-text">
        <span *ngIf="!agenda.isLoading()">💡 Appuyez sur Entrée ou cliquez sur ✨ pour analyser</span>
        <span *ngIf="agenda.isLoading()">🧠 L'IA analyse votre demande...</span>
      </p>
    </div>
  `,
  styles: [`
    .smart-input-wrapper {
      max-width: 700px;
      margin: 0 auto;
    }

    .smart-input-container {
      position: relative;
    }

    .input-glow {
      position: absolute;
      inset: -2px;
      background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
      border-radius: 1.25rem;
      opacity: 0.3;
      filter: blur(10px);
      transition: opacity 0.3s;
    }

    .smart-input-container:hover .input-glow {
      opacity: 0.5;
    }

    .smart-input {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
    }

    .ai-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.1));
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #818cf8;
      flex-shrink: 0;
    }

    .smart-input input {
      flex: 1;
      background: none;
      border: none;
      color: white;
      font-size: 1.1rem;
      font-family: inherit;
      outline: none;
    }

    .smart-input input::placeholder {
      color: #64748b;
    }

    .smart-input input:disabled {
      opacity: 0.5;
    }

    .submit-btn {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border: none;
      border-radius: 0.75rem;
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .submit-btn:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
    }

    .submit-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .loading-dots {
      display: flex;
      gap: 3px;
    }

    .loading-dots span {
      width: 5px;
      height: 5px;
      background: white;
      border-radius: 50%;
      animation: bounce 0.6s infinite;
    }

    .loading-dots span:nth-child(2) { animation-delay: 0.1s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.2s; }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    .helper-text {
      text-align: center;
      color: #64748b;
      font-size: 0.875rem;
      margin-top: 1rem;
    }
  `]
})
export class SmartInputComponent {
  agenda = inject(AgendaService);
  private toast = inject(ToastService);
  inputText = '';

  submitToAI(): void {
    if (!this.inputText.trim() || this.agenda.isLoading()) return;

    const text = this.inputText;
    this.inputText = '';

    this.agenda.analyzeText(text).subscribe({
      next: (event) => {
        this.toast.show(`✨ Événement créé: ${event.title}`, 'success');
      },
      error: () => {
        this.toast.show('Service IA indisponible', 'error');
        this.inputText = text;
      }
    });
  }
}
