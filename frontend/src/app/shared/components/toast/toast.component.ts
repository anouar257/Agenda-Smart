import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-3">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="min-w-[300px] p-4 rounded-xl shadow-2xl flex items-center justify-between transform transition-all duration-300 animate-slide-in"
          [ngClass]="{
            'bg-green-500 text-white': toast.type === 'success',
            'bg-red-500 text-white': toast.type === 'error',
            'bg-blue-500 text-white': toast.type === 'info'
          }"
        >
          <div class="flex items-center gap-3">
            <span class="text-2xl">
              @if(toast.type === 'success') { ✅ }
              @if(toast.type === 'error') { ⚠️ }
              @if(toast.type === 'info') { ℹ️ }
            </span>
            <p class="font-medium text-sm">{{ toast.message }}</p>
          </div>
          <button (click)="toastService.remove(toast.id)" class="opacity-70 hover:opacity-100">✕</button>
        </div>
      }
    </div>
  `,
    styles: [`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slideIn 0.3s ease-out forwards;
    }
  `]
})
export class ToastComponent {
    toastService = inject(ToastService);
}
