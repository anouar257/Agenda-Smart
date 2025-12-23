import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SmartInputComponent } from './components/smart-input.component';
import { CalendarViewComponent } from './components/calendar-view.component';
import { AuthService } from '../../core/services/auth.service';
import { AgendaService } from '../../core/services/agenda.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SmartInputComponent, CalendarViewComponent],
  template: `
    <div class="dashboard">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <span class="logo-text">Agenda<span class="text-gradient">AI</span></span>
        </div>

        <nav class="sidebar-nav">
          <a class="nav-item" [class.active]="currentView() === 'dashboard'" (click)="setView('dashboard')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
          </a>
          <a class="nav-item" [class.active]="currentView() === 'calendar'" (click)="setView('calendar')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Calendrier</span>
          </a>
          <a class="nav-item" [class.active]="currentView() === 'settings'" (click)="setView('settings')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Paramètres</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">{{ auth.username().charAt(0).toUpperCase() }}</div>
            <div class="user-details">
              <span class="user-name">{{ auth.username() }}</span>
              <span class="user-plan">Connecté ✓</span>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Dashboard View -->
        <div *ngIf="currentView() === 'dashboard'" class="view-content">
          <header class="header">
            <div>
              <h1>{{ greeting }} 👋</h1>
              <p>Voici votre agenda pour aujourd'hui.</p>
            </div>
          </header>

          <section class="ai-input-section">
            <app-smart-input></app-smart-input>
          </section>

          <section class="stats-section">
            <div class="ai-briefing glass-card">
              <div class="briefing-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <div class="briefing-content">
                <h3>Briefing IA</h3>
                <p>{{ aiBriefing }}</p>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon blue">📅</div>
                <div class="stat-info">
                  <span class="stat-value">{{ agenda.todayEvents().length }}</span>
                  <span class="stat-label">Aujourd'hui</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon purple">⏰</div>
                <div class="stat-info">
                  <span class="stat-value">{{ agenda.upcomingEvents().length }}</span>
                  <span class="stat-label">À venir</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon green">✅</div>
                <div class="stat-info">
                  <span class="stat-value text-gradient">Actif</span>
                  <span class="stat-label">Statut IA</span>
                </div>
              </div>
            </div>
          </section>

          <section class="events-section" *ngIf="agenda.upcomingEvents().length">
            <h2>Prochains événements</h2>
            <div class="events-list">
              <div class="event-item" *ngFor="let event of agenda.upcomingEvents()">
                <div class="event-color" [style.background]="agenda.getColorForCategory(event.category)"></div>
                <div class="event-info">
                  <span class="event-title">{{ event.title }}</span>
                  <span class="event-date">{{ event.start }} {{ event.end ? '- ' + event.end : '' }}</span>
                </div>
                <span class="event-category">{{ event.category }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Calendar View (Full Screen) -->
        <div *ngIf="currentView() === 'calendar'" class="view-content calendar-full">
          <header class="header">
            <div>
              <h1>Calendrier 📅</h1>
              <p>Cliquez sur un jour pour créer un événement.</p>
            </div>
          </header>
          
          <div class="calendar-fullscreen glass-card">
            <app-calendar-view (dateClick)="onDateClick($event)"></app-calendar-view>
          </div>
        </div>

        <!-- Settings View -->
        <div *ngIf="currentView() === 'settings'" class="view-content">
          <header class="header">
            <div>
              <h1>Paramètres ⚙️</h1>
              <p>Configurez votre application.</p>
            </div>
          </header>
          
          <div class="settings-content glass-card">
            <div class="settings-section">
              <h3>👤 Profil utilisateur</h3>
              <div class="profile-info">
                <div class="profile-avatar">{{ auth.username().charAt(0).toUpperCase() }}</div>
                <div class="profile-details">
                  <span class="profile-name">{{ auth.username() }}</span>
                  <span class="profile-stat">{{ agenda.eventCount() }} événements créés</span>
                </div>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>🎨 Apparence</h3>
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">Mode {{ theme.isDarkMode() ? 'Sombre' : 'Clair' }}</span>
                  <span class="setting-desc">{{ theme.isDarkMode() ? '🌙 Mode nuit activé' : '☀️ Mode jour activé' }}</span>
                </div>
                <button class="theme-toggle" (click)="theme.toggleTheme()">
                  <span class="toggle-track" [class.active]="!theme.isDarkMode()">
                    <span class="toggle-thumb"></span>
                  </span>
                </button>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>🔔 Notifications</h3>
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">{{ notificationService.unreadCount() }} non lues</span>
                  <span class="setting-desc">Notifications en attente</span>
                </div>
                <button class="btn-secondary" (click)="notificationService.markAllAsRead()">Tout marquer lu</button>
              </div>
              
              <div class="notifications-list" *ngIf="notificationService.notifications().length > 0">
                <div class="notification-item" 
                     *ngFor="let notif of notificationService.notifications()" 
                     [class.unread]="!notif.read"
                     (click)="notificationService.markAsRead(notif.id)">
                  <div class="notif-icon">{{ getNotifIcon(notif.type) }}</div>
                  <div class="notif-content">
                    <span class="notif-message">{{ notif.message || notif.title }}</span>
                    <span class="notif-time">{{ getTimeAgo(notif.timestamp) }}</span>
                  </div>
                  <span class="notif-badge" *ngIf="!notif.read">●</span>
                </div>
              </div>
              
              <div class="no-notifications" *ngIf="notificationService.notifications().length === 0">
                <p>Aucune notification</p>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>📊 Statistiques</h3>
              <div class="stats-mini">
                <div class="stat-mini-item">
                  <span class="stat-mini-value">{{ agenda.todayEvents().length }}</span>
                  <span class="stat-mini-label">Aujourd'hui</span>
                </div>
                <div class="stat-mini-item">
                  <span class="stat-mini-value">{{ agenda.upcomingEvents().length }}</span>
                  <span class="stat-mini-label">À venir</span>
                </div>
                <div class="stat-mini-item">
                  <span class="stat-mini-value">{{ agenda.eventCount() }}</span>
                  <span class="stat-mini-label">Total</span>
                </div>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>ℹ️ À propos</h3>
              <p class="about-text">
                <strong>Smart Agenda AI</strong> v1.0<br>
                Microservices: Spring Boot, Angular 20<br>
                IA: OpenRouter (Mistral-7B)<br>
                Message Queue: Apache Kafka
              </p>
            </div>
          </div>
        </div>

        <!-- Create Event Modal -->
        <div class="modal-overlay" *ngIf="showCreateModal()" (click)="closeModal()">
          <div class="modal-content glass-card" (click)="$event.stopPropagation()">
            <h2>Nouvel événement</h2>
            <p class="modal-date">📅 {{ selectedDate() }}</p>
            
            <div class="form-group">
              <label>Titre</label>
              <input type="text" [(ngModel)]="newEventTitle" class="input-field" placeholder="Ex: Réunion équipe">
            </div>
            
            <div class="form-group">
              <label>Heure</label>
              <input type="time" [(ngModel)]="newEventTime" class="input-field">
            </div>
            
            <div class="form-group">
              <label>Catégorie</label>
              <select [(ngModel)]="newEventCategory" class="input-field">
                <option value="WORK">Travail</option>
                <option value="HEALTH">Santé</option>
                <option value="SPORT">Sport</option>
                <option value="SOCIAL">Social</option>
              </select>
            </div>
            
            <div class="modal-actions">
              <button class="btn-secondary" (click)="closeModal()">Annuler</button>
              <button class="btn-primary" (click)="createEventManually()">Créer</button>
            </div>
          </div>
        </div>

        <footer class="footer">
          © 2024 Smart Agenda AI • Microservices + Kafka
        </footer>
      </main>
    </div>
  `,
  styles: [`
    .dashboard { display: flex; min-height: 100vh; background: #0f172a; }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: rgba(30, 41, 59, 0.5);
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .logo-text { font-size: 1.25rem; font-weight: 700; }

    .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      color: #94a3b8;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .nav-item:hover { background: rgba(255, 255, 255, 0.05); color: white; }
    .nav-item.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.1));
      color: white;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .sidebar-footer {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-info { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
    .user-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #6366f1, #ec4899);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 500; font-size: 0.875rem; }
    .user-plan { font-size: 0.75rem; color: #64748b; }

    .logout-btn {
      padding: 0.5rem;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }
    .logout-btn:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

    /* Main Content */
    .main-content { flex: 1; padding: 2rem; overflow-y: auto; }
    .view-content { max-width: 1200px; }
    .header h1 { font-size: 2rem; font-weight: 700; margin-bottom: 0.25rem; }
    .header p { color: #94a3b8; }
    .ai-input-section { margin: 2rem 0; }

    .stats-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .ai-briefing { display: flex; gap: 1rem; align-items: flex-start; }
    .briefing-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.1));
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #818cf8;
      flex-shrink: 0;
    }
    .briefing-content h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .briefing-content p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; }

    .stats-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 0.75rem;
    }
    .stat-icon { font-size: 1.5rem; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.25rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: #64748b; }

    .events-section { margin-bottom: 2rem; }
    .events-section h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
    .events-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .event-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 0.75rem;
    }
    .event-color { width: 4px; height: 40px; border-radius: 2px; }
    .event-info { flex: 1; display: flex; flex-direction: column; }
    .event-title { font-weight: 500; }
    .event-date { font-size: 0.8rem; color: #64748b; }
    .event-category {
      padding: 0.25rem 0.75rem;
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 1rem;
    }

    /* Calendar Full View */
    .calendar-fullscreen { padding: 1.5rem; min-height: 600px; }

    /* Settings */
    .settings-content { padding: 2rem; }
    .settings-content h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
    .text-muted { color: #64748b; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal-content {
      width: 100%;
      max-width: 400px;
      padding: 2rem;
    }
    .modal-content h2 { margin-bottom: 0.5rem; }
    .modal-date { color: #818cf8; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.5rem; }
    .modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
    .modal-actions button { flex: 1; }

    .footer {
      text-align: center;
      color: #64748b;
      font-size: 0.875rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    @media (max-width: 1024px) {
      .sidebar { display: none; }
      .stats-section { grid-template-columns: 1fr; }
    }

    /* Settings Styles */
    .settings-section { margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .settings-section:last-child { border-bottom: none; margin-bottom: 0; }
    .settings-section h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-white); }
    
    .profile-info { display: flex; align-items: center; gap: 1rem; }
    .profile-avatar { width: 56px; height: 56px; background: linear-gradient(135deg, #6366f1, #ec4899); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; }
    .profile-details { display: flex; flex-direction: column; }
    .profile-name { font-size: 1.1rem; font-weight: 600; }
    .profile-stat { font-size: 0.85rem; color: #94a3b8; }
    
    .setting-item { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; }
    .setting-info { display: flex; flex-direction: column; }
    .setting-label { font-weight: 500; }
    .setting-desc { font-size: 0.8rem; color: #94a3b8; }
    
    .theme-toggle { background: none; border: none; cursor: pointer; padding: 0; }
    .toggle-track { display: block; width: 50px; height: 26px; background: #334155; border-radius: 13px; position: relative; transition: background 0.3s; }
    .toggle-track.active { background: linear-gradient(135deg, #6366f1, #a855f7); }
    .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: transform 0.3s; }
    .toggle-track.active .toggle-thumb { transform: translateX(24px); }
    
    .stats-mini { display: flex; gap: 1rem; }
    .stat-mini-item { flex: 1; text-align: center; padding: 1rem; background: rgba(99, 102, 241, 0.1); border-radius: 0.75rem; border: 1px solid rgba(99, 102, 241, 0.2); }
    .stat-mini-value { display: block; font-size: 1.5rem; font-weight: 700; color: #818cf8; }
    .stat-mini-label { font-size: 0.75rem; color: #94a3b8; }
    
    .about-text { color: #94a3b8; line-height: 1.8; }

    /* Notification Bell */
    .notification-bell { position: relative; background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.5rem; border-radius: 0.5rem; transition: all 0.2s; }
    .notification-bell:hover { background: rgba(255,255,255,0.05); color: white; }
    .notification-badge { position: absolute; top: 0; right: 0; background: #ef4444; color: white; font-size: 0.65rem; font-weight: 700; min-width: 16px; height: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  `]
})
export class DashboardComponent {
  auth = inject(AuthService);
  private toast = inject(ToastService);
  agenda = inject(AgendaService);
  theme = inject(ThemeService);
  notificationService = inject(NotificationService);

  // View state
  currentView = signal<'dashboard' | 'calendar' | 'settings'>('dashboard');

  // Modal state
  showCreateModal = signal(false);
  selectedDate = signal('');
  newEventTitle = '';
  newEventTime = '';
  newEventCategory = 'WORK';

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  get aiBriefing(): string {
    const count = this.agenda.todayEvents().length;
    if (count === 0) return "Journée libre ! Utilisez la barre IA pour planifier.";
    if (count === 1) return "1 événement aujourd'hui.";
    return `${count} événements prévus aujourd'hui.`;
  }

  setView(view: 'dashboard' | 'calendar' | 'settings'): void {
    this.currentView.set(view);
  }

  onDateClick(date: string): void {
    this.selectedDate.set(date);
    this.showCreateModal.set(true);
  }

  closeModal(): void {
    this.showCreateModal.set(false);
    this.newEventTitle = '';
    this.newEventTime = '';
    this.newEventCategory = 'WORK';
  }

  createEventManually(): void {
    if (!this.newEventTitle.trim()) {
      this.toast.show('Entrez un titre', 'info');
      return;
    }

    const event = {
      id: Date.now().toString(),
      title: this.newEventTitle,
      start: this.selectedDate(),
      end: this.newEventTime || undefined,
      category: this.newEventCategory as any,
      priority: 'MEDIUM' as const
    };

    // Save to database and wait for response
    this.agenda.saveEvent(event).subscribe({
      next: () => {
        this.toast.show('✅ Événement créé!', 'success');
        this.closeModal();
        // Reload events to refresh calendar
        this.agenda.loadEvents();
      },
      error: () => {
        this.toast.show('Erreur lors de la sauvegarde', 'error');
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }

  getNotifIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'REMINDER': '⏰',
      'CREATED': '✅',
      'UPDATED': '📝',
      'DELETED': '🗑️',
      'AI_EXTRACTED': '🤖',
      'TEST': '🔔'
    };
    return icons[type] || '📣';
  }

  getTimeAgo(timestamp: Date | string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  }
}
