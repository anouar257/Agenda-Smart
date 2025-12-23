/**
 * CalendarEvent Model - Strict TypeScript Interface
 * Following Angular 18 Best Practices
 */

export type EventCategory = 'WORK' | 'HEALTH' | 'SPORT' | 'SOCIAL';
export type EventPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CalendarEvent {
    id?: string;
    title: string;
    start: string;  // ISO 8601 format: YYYY-MM-DD
    end?: string;   // ISO 8601 format: HH:mm or full datetime
    category: EventCategory;
    priority: EventPriority;
    aiSummary?: string;
    description?: string;
    location?: string;
    createdAt?: string;
}

export interface AIParseRequest {
    text: string;
}

export interface AIParseResponse extends CalendarEvent {
    confidence?: number;
}

// Category color mapping for UI
export const CATEGORY_COLORS: Record<EventCategory, string> = {
    WORK: '#3b82f6',    // blue-500
    HEALTH: '#ef4444',  // red-500
    SPORT: '#10b981',   // emerald-500
    SOCIAL: '#f59e0b'   // amber-500
};

// Priority badge styles
export const PRIORITY_STYLES: Record<EventPriority, string> = {
    HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};
