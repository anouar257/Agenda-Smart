import { Injectable, signal, inject } from '@angular/core';
import { ToastService } from './toast.service';

export interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'reminder' | 'TEST' | 'CREATED' | 'UPDATED' | 'DELETED' | 'AI_EXTRACTED' | 'REMINDER';
    timestamp: Date;
    read: boolean;
    eventId?: string;
    title?: string;
    userId?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private toast = inject(ToastService);

    private readonly _notifications = signal<Notification[]>([]);
    private readonly _unreadCount = signal<number>(0);

    readonly notifications = this._notifications.asReadonly();
    readonly unreadCount = this._unreadCount.asReadonly();

    constructor() {
        this.loadNotifications();
        // Polling for notifications every 30 seconds
        this.startPolling();
    }

    private startPolling(): void {
        // Check for new notifications via API every 30 seconds
        setInterval(() => {
            this.checkForNewNotifications();
        }, 30000);
    }

    private async checkForNewNotifications(): Promise<void> {
        try {
            const response = await fetch('/api/notifications/latest');
            if (response.ok) {
                const notifications = await response.json();
                // Process new notifications...
            }
        } catch (e) {
            // Silently fail - server might not support this endpoint yet
        }
    }

    private loadNotifications(): void {
        const saved = localStorage.getItem('agenda-notifications');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this._notifications.set(parsed);
                this.updateUnreadCount();
            } catch (e) {
                console.error('[Notifications] Error loading:', e);
            }
        }
    }

    addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
        const newNotif: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false
        };

        this._notifications.update(current => [newNotif, ...current].slice(0, 20));
        this.updateUnreadCount();
        this.saveToStorage();

        // Show toast
        this.toast.show(notification.message || notification.title || 'Nouvelle notification', 'success');
    }

    // Method to receive notification from external source (like API response)
    receiveNotification(data: any): void {
        const notification: Notification = {
            id: data.id || Date.now().toString(),
            message: data.message || `${data.type}: ${data.title}`,
            type: data.type || 'info',
            title: data.title,
            userId: data.userId,
            eventId: data.eventId,
            timestamp: new Date(data.timestamp || Date.now()),
            read: false
        };

        this._notifications.update(current => [notification, ...current].slice(0, 20));
        this.updateUnreadCount();
        this.saveToStorage();

        this.toast.show(notification.message, 'success');
    }

    markAsRead(id: string): void {
        this._notifications.update(current =>
            current.map(n => n.id === id ? { ...n, read: true } : n)
        );
        this.updateUnreadCount();
        this.saveToStorage();
    }

    markAllAsRead(): void {
        this._notifications.update(current =>
            current.map(n => ({ ...n, read: true }))
        );
        this._unreadCount.set(0);
        this.saveToStorage();
    }

    clearAll(): void {
        this._notifications.set([]);
        this._unreadCount.set(0);
        localStorage.removeItem('agenda-notifications');
    }

    private updateUnreadCount(): void {
        const count = this._notifications().filter(n => !n.read).length;
        this._unreadCount.set(count);
    }

    private saveToStorage(): void {
        localStorage.setItem('agenda-notifications', JSON.stringify(this._notifications()));
    }
}
