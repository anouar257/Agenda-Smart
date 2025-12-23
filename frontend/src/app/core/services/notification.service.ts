import { Injectable, signal, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

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
    private stompClient: Client | null = null;

    private readonly _notifications = signal<Notification[]>([]);
    private readonly _unreadCount = signal<number>(0);
    private readonly _connected = signal<boolean>(false);

    readonly notifications = this._notifications.asReadonly();
    readonly unreadCount = this._unreadCount.asReadonly();
    readonly connected = this._connected.asReadonly();

    constructor() {
        this.loadNotifications();
        this.connectWebSocket();
    }

    private connectWebSocket(): void {
        // Use SockJS for WebSocket connection (matches backend config)
        const wsHost = window.location.hostname;
        const sockJsUrl = `http://${wsHost}:8085/ws/notifications`;

        console.log('[WebSocket] Connecting via SockJS to:', sockJsUrl);

        this.stompClient = new Client({
            // Use SockJS instead of native WebSocket
            webSocketFactory: () => new SockJS(sockJsUrl),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (str) => {
                console.log('[STOMP Debug]', str);
            },
            onConnect: () => {
                console.log('[WebSocket] ✅ Connected successfully');
                this._connected.set(true);

                // Subscribe to global notifications topic
                this.stompClient?.subscribe('/topic/notifications', (message) => {
                    console.log('[WebSocket] Received notification:', message.body);
                    try {
                        const notification = JSON.parse(message.body);
                        this.receiveNotification(notification);
                    } catch (e) {
                        console.error('[WebSocket] Error parsing message:', e);
                    }
                });
            },
            onDisconnect: () => {
                console.log('[WebSocket] Disconnected');
                this._connected.set(false);
            },
            onStompError: (frame) => {
                console.error('[WebSocket] STOMP Error:', frame.headers['message']);
                this._connected.set(false);
            },
            onWebSocketError: (event) => {
                console.error('[WebSocket] Connection Error:', event);
                this._connected.set(false);
            }
        });

        this.stompClient.activate();
    }

    disconnect(): void {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this._connected.set(false);
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

    // Method to receive notification from WebSocket or external source
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
        this._notifications.set([]);
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

