import { Component, inject, computed, OnInit, Output, EventEmitter, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AgendaService } from '../../../core/services/agenda.service';
import { CATEGORY_COLORS } from '../../../core/models/calendar-event.model';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  template: `<div class="calendar-wrapper"><full-calendar [options]="calendarOptions"></full-calendar></div>`,
  styles: [`
    .calendar-wrapper { min-height: 500px; }
    :host ::ng-deep .fc { font-family: 'Outfit', sans-serif; }
    :host ::ng-deep .fc-theme-standard td,
    :host ::ng-deep .fc-theme-standard th { border-color: rgba(255, 255, 255, 0.05); }
    :host ::ng-deep .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 700; color: #f8fafc; }
    :host ::ng-deep .fc .fc-button {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
    }
    :host ::ng-deep .fc .fc-button:hover { background: rgba(99, 102, 241, 0.3); color: white; }
    :host ::ng-deep .fc .fc-button-active { background: #6366f1 !important; color: white !important; }
    :host ::ng-deep .fc .fc-col-header-cell-cushion {
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.7rem;
    }
    :host ::ng-deep .fc .fc-daygrid-day-number { color: #94a3b8; font-weight: 500; }
    :host ::ng-deep .fc .fc-day-today { background: rgba(99, 102, 241, 0.1) !important; }
    :host ::ng-deep .fc .fc-day-today .fc-daygrid-day-number { color: #818cf8; font-weight: 700; }
    :host ::ng-deep .fc .fc-daygrid-day:hover { background: rgba(99, 102, 241, 0.05); cursor: pointer; }
    :host ::ng-deep .fc .fc-event {
      border: none;
      border-radius: 4px;
      padding: 2px 6px;
      font-weight: 500;
      font-size: 0.8rem;
      cursor: pointer;
    }
    :host ::ng-deep .fc .fc-event:hover { filter: brightness(1.1); }
    :host ::ng-deep .fc .fc-highlight { background: rgba(99, 102, 241, 0.2) !important; }
  `]
})
export class CalendarViewComponent implements OnInit {
  @Output() dateClick = new EventEmitter<string>();

  private agenda = inject(AgendaService);

  // Computed signal for events - transforms to FullCalendar format
  calendarEvents = computed<EventInput[]>(() => {
    const events = this.agenda.events();
    console.log('Calendar events updated:', events);
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.end ? `${event.start}T${event.end}` : event.start,
      backgroundColor: CATEGORY_COLORS[event.category] || '#6366f1',
      borderColor: CATEGORY_COLORS[event.category] || '#6366f1'
    }));
  });

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: 'fr',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour'
    },
    events: [], // Will be updated by effect
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: 3,
    height: 'auto',
    nowIndicator: true,
    dateClick: (info) => {
      this.dateClick.emit(info.dateStr);
    },
    select: (info: DateSelectArg) => {
      this.dateClick.emit(info.startStr);
    }
  };

  constructor() {
    // Effect to update calendar when events change
    effect(() => {
      const events = this.calendarEvents();
      // Update the calendar options with new events
      this.calendarOptions = {
        ...this.calendarOptions,
        events: events
      };
    });
  }

  ngOnInit(): void {
    // Initial load
    this.calendarOptions.events = this.calendarEvents();
  }
}
