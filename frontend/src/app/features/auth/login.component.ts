import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <!-- Background -->
      <div class="login-bg"></div>
      
      <div class="login-container animate-fade-in-up">
        <!-- Logo -->
        <div class="login-logo">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <span class="logo-text">Agenda<span class="text-gradient">AI</span></span>
        </div>

        <!-- Tabs -->
        <div class="auth-tabs">
          <button 
            [class.active]="!isRegister" 
            (click)="isRegister = false"
          >Se connecter</button>
          <button 
            [class.active]="isRegister" 
            (click)="isRegister = true"
          >S'inscrire</button>
        </div>

        <!-- Login Form -->
        <form *ngIf="!isRegister" (ngSubmit)="login()" class="auth-form">
          <h1>Bienvenue</h1>
          <p class="subtitle">Connectez-vous à votre espace intelligent</p>
          
          <div class="form-group">
            <label>Nom d'utilisateur</label>
            <input 
              type="text" 
              [(ngModel)]="username" 
              name="username"
              class="input-field" 
              placeholder="Entrez votre nom d'utilisateur"
              required
            >
          </div>
          
          <div class="form-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password"
              class="input-field" 
              placeholder="••••••••"
              required
            >
          </div>

          <button type="submit" class="btn-primary w-full" [disabled]="isLoading">
            <span *ngIf="!isLoading">Se connecter</span>
            <span *ngIf="isLoading" class="loading-dots">
              <span></span><span></span><span></span>
            </span>
          </button>
        </form>

        <!-- Register Form -->
        <form *ngIf="isRegister" (ngSubmit)="register()" class="auth-form">
          <h1>Créer un compte</h1>
          <p class="subtitle">Rejoignez l'agenda intelligent</p>
          
          <div class="form-group">
            <label>Nom d'utilisateur</label>
            <input 
              type="text" 
              [(ngModel)]="username" 
              name="username"
              class="input-field" 
              placeholder="Choisissez un nom d'utilisateur"
              required
            >
          </div>
          
          <div class="form-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password"
              class="input-field" 
              placeholder="Créez un mot de passe sécurisé"
              required
            >
          </div>

          <div class="form-group">
            <label>Confirmer le mot de passe</label>
            <input 
              type="password" 
              [(ngModel)]="confirmPassword" 
              name="confirmPassword"
              class="input-field" 
              placeholder="Confirmez votre mot de passe"
              required
            >
          </div>

          <button type="submit" class="btn-primary w-full" [disabled]="isLoading">
            <span *ngIf="!isLoading">Créer mon compte</span>
            <span *ngIf="isLoading" class="loading-dots">
              <span></span><span></span><span></span>
            </span>
          </button>
        </form>

        <!-- Footer -->
        <div class="auth-footer">
          <p>© 2024 Smart Agenda AI</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      position: relative;
    }
    
    .login-bg {
      position: fixed;
      inset: 0;
      background: 
        radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%);
      z-index: -1;
    }
    
    .login-container {
      width: 100%;
      max-width: 420px;
      background: rgba(30, 41, 59, 0.9);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1.5rem;
      padding: 2.5rem;
    }
    
    .login-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    
    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }
    
    .auth-tabs {
      display: flex;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.75rem;
      padding: 0.25rem;
      margin-bottom: 2rem;
    }
    
    .auth-tabs button {
      flex: 1;
      padding: 0.75rem;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-family: inherit;
      font-weight: 500;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .auth-tabs button.active {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: white;
    }
    
    .auth-form h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .auth-form .subtitle {
      color: #94a3b8;
      margin-bottom: 2rem;
    }
    
    .form-group {
      margin-bottom: 1.25rem;
    }
    
    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }
    
    .loading-dots {
      display: flex;
      gap: 4px;
    }
    
    .loading-dots span {
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
      animation: bounce 0.6s infinite;
    }
    
    .loading-dots span:nth-child(2) { animation-delay: 0.1s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.2s; }
    
    .auth-footer {
      margin-top: 2rem;
      text-align: center;
      color: #64748b;
      font-size: 0.875rem;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  username = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  isRegister = false;

  login(): void {
    if (!this.username || !this.password) {
      this.toast.show('Veuillez remplir tous les champs', 'info');
      return;
    }

    this.isLoading = true;
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.toast.show('Bienvenue! 🚀', 'success');
        this.isLoading = false;
        // Force navigation to dashboard
        console.log('[Login] Success, navigating to dashboard...');
        this.router.navigate(['/dashboard']).then(() => {
          console.log('[Login] Navigation completed');
        });
      },
      error: (err) => {
        console.error('[Login] Error:', err);
        this.toast.show('Identifiants incorrects', 'error');
        this.isLoading = false;
      }
    });
  }

  register(): void {
    if (!this.username || !this.password || !this.confirmPassword) {
      this.toast.show('Veuillez remplir tous les champs', 'info');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toast.show('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    this.isLoading = true;
    this.authService.register({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.toast.show('Compte créé! Connectez-vous maintenant.', 'success');
        this.isRegister = false;
        this.isLoading = false;
      },
      error: () => {
        this.toast.show('Erreur lors de la création du compte', 'error');
        this.isLoading = false;
      }
    });
  }
}
