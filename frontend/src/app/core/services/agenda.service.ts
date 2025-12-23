import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalendarEvent, AIParseResponse, CATEGORY_COLORS } from '../models/calendar-event.model';
import { tap, catchError, finalize, timeout, switchMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AgendaService {
    private http = inject(HttpClient);

    private readonly _events = signal<CalendarEvent[]>([]);
    private readonly _isLoading = signal<boolean>(false);
    private readonly _error = signal<string | null>(null);

    readonly events = this._events.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();
    readonly error = this._error.asReadonly();

    readonly todayEvents = computed(() => {
        const today = new Date().toISOString().split('T')[0];
        return this._events().filter(e => e.start === today);
    });

    readonly upcomingEvents = computed(() => {
        const today = new Date().toISOString().split('T')[0];
        return this._events()
            .filter(e => e.start >= today)
            .sort((a, b) => a.start.localeCompare(b.start))
            .slice(0, 5);
    });

    readonly nextEvent = computed(() => this.upcomingEvents()[0] || null);
    readonly eventCount = computed(() => this._events().length);

    private readonly AI_URL = '/api/ai/extract';
    private readonly CALENDAR_URL = '/api/calendar';
    // Increase timeout to 2 minutes for slow AI
    private readonly AI_TIMEOUT = 120000;

    constructor() {
        this.loadEvents();
    }

    loadEvents(): void {
        this._isLoading.set(true);
        this.http.get<any[]>(this.CALENDAR_URL).pipe(
            tap((data: any[]) => {
                const mapped = data.map(e => this.mapBackendEvent(e));
                this._events.set(mapped);
                console.log('[Agenda] Events loaded:', mapped.length);
            }),
            catchError(err => {
                console.error('[Agenda] Load error:', err);
                return of([]);
            }),
            finalize(() => this._isLoading.set(false))
        ).subscribe();
    }

    analyzeText(text: string) {
        this._isLoading.set(true);
        this._error.set(null);
        console.log('[Agenda] Sending to AI:', text);

        return this.http.post<any>(this.AI_URL, { text }).pipe(
            timeout(this.AI_TIMEOUT),
            switchMap(aiResponse => {
                console.log('[Agenda] AI Response:', aiResponse);
                const action = aiResponse.action || 'CREATE';

                // Handle DELETE action
                if (action === 'DELETE') {
                    const searchTitle = aiResponse.searchTitle || aiResponse.title;
                    const eventToDelete = this.findEventByTitle(searchTitle);
                    if (eventToDelete) {
                        return this.http.delete(`${this.CALENDAR_URL}/${eventToDelete.id}`).pipe(
                            tap(() => {
                                this._events.update(current => current.filter(e => e.id !== eventToDelete.id));
                                console.log('[Agenda] Event deleted via AI:', eventToDelete.title);
                            })
                        );
                    } else {
                        throw new Error(`Événement "${searchTitle}" non trouvé`);
                    }
                }

                // Handle UPDATE action
                if (action === 'UPDATE') {
                    const searchTitle = aiResponse.searchTitle || aiResponse.title;
                    const eventToUpdate = this.findEventByTitle(searchTitle);
                    if (eventToUpdate) {
                        const updateData = {
                            title: aiResponse.title || eventToUpdate.title,
                            startDate: aiResponse.startDate || eventToUpdate.start,
                            startTime: aiResponse.startTime || eventToUpdate.end,
                            category: aiResponse.category || eventToUpdate.category,
                            priority: aiResponse.priority || eventToUpdate.priority
                        };
                        return this.http.put<any>(`${this.CALENDAR_URL}/${eventToUpdate.id}`, updateData).pipe(
                            tap(updated => {
                                const mapped = this.mapBackendEvent(updated);
                                this._events.update(current =>
                                    current.map(e => e.id === eventToUpdate.id ? mapped : e)
                                );
                                console.log('[Agenda] Event updated via AI:', mapped);
                            })
                        );
                    } else {
                        throw new Error(`Événement "${searchTitle}" non trouvé`);
                    }
                }

                // Handle CREATE action (default)
                const eventToSave = {
                    title: aiResponse.title || text,
                    startDate: aiResponse.startDate || new Date().toISOString().split('T')[0],
                    startTime: aiResponse.startTime || null,
                    category: aiResponse.category || 'WORK',
                    priority: aiResponse.priority || 'MEDIUM'
                };
                console.log('[Agenda] Creating event:', eventToSave);
                return this.http.post<any>(this.CALENDAR_URL, eventToSave).pipe(
                    tap(savedEvent => {
                        console.log('[Agenda] Event created:', savedEvent);
                        const newEvent = this.mapBackendEvent(savedEvent);
                        this._events.update(current => [...current, newEvent]);
                    })
                );
            }),
            catchError(err => {
                console.error('[Agenda] Error:', err);
                let errorMsg = err.message || 'Service indisponible';
                if (err.name === 'TimeoutError') {
                    errorMsg = 'L\'IA met trop de temps (>2min)';
                } else if (err.status === 401) {
                    errorMsg = 'Session expirée - reconnectez-vous';
                } else if (err.status === 0) {
                    errorMsg = 'Serveur inaccessible';
                }
                this._error.set(errorMsg);
                this._isLoading.set(false);
                return throwError(() => err);
            }),
            finalize(() => this._isLoading.set(false))
        );
    }

    saveEvent(event: CalendarEvent) {
        const eventToSave = {
            title: event.title,
            startDate: event.start,
            startTime: event.end || null,
            category: event.category || 'WORK',
            priority: event.priority || 'MEDIUM'
        };

        return this.http.post<any>(this.CALENDAR_URL, eventToSave).pipe(
            tap(savedEvent => {
                console.log('[Agenda] Event saved:', savedEvent);
                const newEvent = this.mapBackendEvent(savedEvent);
                this._events.update(current => [...current, newEvent]);
            }),
            catchError(err => {
                console.error('[Agenda] Save error:', err);
                return throwError(() => err);
            })
        );
    }

    addEvent(event: CalendarEvent): void {
        this.saveEvent(event).subscribe({
            error: () => console.error('[Agenda] Failed to save event')
        });
    }

    removeEvent(id: string): void {
        this.http.delete(`${this.CALENDAR_URL}/${id}`).subscribe({
            next: () => {
                this._events.update(current => current.filter(e => e.id !== id));
                console.log('[Agenda] Event deleted:', id);
            },
            error: err => console.error('[Agenda] Delete error:', err)
        });
    }

    updateEvent(id: string, event: Partial<CalendarEvent>): void {
        const eventToUpdate = {
            title: event.title,
            startDate: event.start,
            startTime: event.end || null,
            category: event.category || 'WORK',
            priority: event.priority || 'MEDIUM',
            description: event.aiSummary
        };

        this.http.put<any>(`${this.CALENDAR_URL}/${id}`, eventToUpdate).subscribe({
            next: (updatedEvent) => {
                const mapped = this.mapBackendEvent(updatedEvent);
                this._events.update(current =>
                    current.map(e => e.id === id ? mapped : e)
                );
                console.log('[Agenda] Event updated:', mapped);
            },
            error: err => console.error('[Agenda] Update error:', err)
        });
    }

    findEventByTitle(title: string): CalendarEvent | undefined {
        const lower = title.toLowerCase();
        return this._events().find(e =>
            e.title.toLowerCase().includes(lower)
        );
    }

    private mapBackendEvent(e: any): CalendarEvent {
        return {
            id: e.id?.toString(),
            title: e.title || 'Sans titre',
            start: e.startDate || e.start || new Date().toISOString().split('T')[0],
            end: e.startTime || e.end,
            category: e.category || 'WORK',
            priority: e.priority || 'MEDIUM',
            aiSummary: e.description
        };
    }

    getColorForCategory(category: string): string {
        return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6366f1';
    }

    clearError(): void {
        this._error.set(null);
    }
}
