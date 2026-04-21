import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppStateService } from '../../core/services/app-state.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import { CalendarEvent } from '../../core/models';
import { EventDrawerComponent } from './event-drawer.component';

type ViewMode = 'month' | 'week' | 'list';
type EventType = 'training' | 'match' | 'event';

interface DayGroup {
  key: string;
  date: Date;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [FormsModule, IconComponent, FormatDatePipe, EventDrawerComponent],
  template: `
    <div style="padding:24px;display:flex;flex-direction:column;gap:16px;height:calc(100vh - var(--topbar-h))">
      <!-- Page header -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <h1 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em">Kalender</h1>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">{{ filteredEvents().length }} Events</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="display:flex;gap:0;background:var(--bg-subtle);border-radius:6px;padding:2px">
            @for (v of viewModes; track v.k) {
              <button
                type="button"
                (click)="view.set(v.k)"
                [style.background]="view() === v.k ? 'var(--bg-elev)' : 'transparent'"
                [style.color]="view() === v.k ? 'var(--text)' : 'var(--text-muted)'"
                [style.box-shadow]="view() === v.k ? 'var(--shadow-xs)' : 'none'"
                style="padding:5px 12px;border-radius:5px;font-size:12px;font-weight:500;border:0;cursor:pointer">
                {{ v.l }}
              </button>
            }
          </div>
          <button class="btn btn-primary" type="button" (click)="state.openAddEvent()">
            <app-icon name="plus" [size]="13" /> Event
          </button>
        </div>
      </div>

      <!-- Filter bar -->
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:4px">
          <button class="btn btn-ghost btn-icon" type="button" (click)="shift(-1)"><app-icon name="chevronLeft" [size]="14" /></button>
          <button class="btn btn-sm" type="button" (click)="goToday()">Heute</button>
          <button class="btn btn-ghost btn-icon" type="button" (click)="shift(1)"><app-icon name="chevronRight" [size]="14" /></button>
        </div>
        <div style="font-size:15px;font-weight:600;letter-spacing:-0.01em;text-transform:capitalize">{{ monthLabel() }}</div>

        <div style="flex:1"></div>

        <select class="select" [(ngModel)]="teamFilter" style="min-width:160px">
          <option value="">Alle Teams</option>
          @for (t of data.teams; track t.id) {
            <option [value]="t.id">{{ t.name }}</option>
          }
        </select>

        <div style="display:flex;gap:6px">
          @for (t of typeOptions; track t.k) {
            <button
              type="button"
              (click)="toggleType(t.k)"
              [style.background]="typeFilter().has(t.k) ? t.c + '20' : 'transparent'"
              [style.color]="typeFilter().has(t.k) ? t.c : 'var(--text-muted)'"
              [style.border]="'1px solid ' + (typeFilter().has(t.k) ? 'transparent' : 'var(--border)')"
              style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:var(--r-full);font-size:12px;font-weight:500;cursor:pointer">
              <span [style.background]="t.c" [style.opacity]="typeFilter().has(t.k) ? 1 : 0.4" style="width:8px;height:8px;border-radius:2px"></span>
              {{ t.l }}
            </button>
          }
        </div>
      </div>

      <!-- Calendar area -->
      <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column">
        @switch (view()) {
          @case ('month') {
            <!-- MONTH VIEW -->
            <div style="display:flex;flex-direction:column;height:100%">
              <div style="display:grid;grid-template-columns:repeat(7, 1fr);border-bottom:1px solid var(--border)">
                @for (d of weekdayLabels; track d) {
                  <div style="padding:8px 10px;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em">{{ d }}</div>
                }
              </div>
              <div style="display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr;flex:1;overflow:hidden">
                @for (cell of monthCells(); track $index; let i = $index) {
                  <div
                    (click)="state.openAddEvent(cell.date)"
                    [style.background]="cell.inMonth ? 'transparent' : 'var(--bg-subtle)'"
                    [style.border-right]="($index + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none'"
                    [style.border-bottom]="$index < 35 ? '1px solid var(--border)' : 'none'"
                    style="padding:6px;cursor:pointer;min-height:0;overflow:hidden;transition:background .1s">
                    <div
                      [style.background]="cell.isToday ? 'var(--primary)' : 'transparent'"
                      [style.color]="cell.isToday ? '#fff' : cell.inMonth ? 'var(--text)' : 'var(--text-faint)'"
                      [style.font-weight]="cell.isToday ? 700 : 500"
                      style="display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;border-radius:50%;font-size:11px;margin-bottom:4px">
                      {{ cell.date.getDate() }}
                    </div>
                    <div style="display:flex;flex-direction:column;gap:2px">
                      @for (e of cell.events.slice(0, 3); track e.id) {
                        <button
                          type="button"
                          (click)="openEvent($event, e)"
                          [style.color]="typeColor(e.type)"
                          [style.background]="typeBg(e.type)"
                          style="text-align:left;padding:2px 6px;border-radius:3px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;border:0;cursor:pointer">
                          <span style="font-variant-numeric:tabular-nums">{{ e.start | formatDate:'time' }}</span> {{ e.title }}
                        </button>
                      }
                      @if (cell.events.length > 3) {
                        <div style="font-size:10px;color:var(--text-muted);padding:0 6px">+{{ cell.events.length - 3 }} weitere</div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
          @case ('week') {
            <!-- WEEK VIEW -->
            <div style="display:flex;flex-direction:column;height:100%">
              <div style="display:grid;grid-template-columns:60px repeat(7, 1fr);border-bottom:1px solid var(--border)">
                <div></div>
                @for (d of weekDays(); track $index; let i = $index) {
                  <div style="padding:8px 10px;font-size:11px;text-align:center;border-left:1px solid var(--border)">
                    <div style="color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;font-weight:600">{{ weekdayLabels[i] }}</div>
                    <div [style.color]="d.isToday ? 'var(--primary)' : 'var(--text)'" style="font-size:14px;font-weight:600;margin-top:2px">{{ d.date.getDate() }}</div>
                  </div>
                }
              </div>
              <div style="flex:1;overflow-y:auto;position:relative">
                <div style="display:grid;grid-template-columns:60px repeat(7, 1fr);position:relative">
                  <div>
                    @for (h of hours; track h) {
                      <div style="height:30px;padding:2px 6px;font-size:10px;color:var(--text-muted);text-align:right;border-bottom:1px solid var(--border)">{{ padHour(h) }}:00</div>
                    }
                  </div>
                  @for (d of weekDays(); track $index; let di = $index) {
                    <div
                      [style.background]="d.isToday ? 'var(--primary-subtle, transparent)' : 'transparent'"
                      style="position:relative;border-left:1px solid var(--border)">
                      @for (h of hours; track h) {
                        <div (click)="state.openAddEvent(d.date, h)" style="height:30px;border-bottom:1px solid var(--border);cursor:pointer"></div>
                      }
                      @for (e of d.events; track e.id) {
                        <button
                          type="button"
                          (click)="openEvent($event, e)"
                          [style.top.px]="eventTop(e)"
                          [style.height.px]="eventHeight(e)"
                          [style.color]="typeColor(e.type)"
                          [style.background]="typeBg(e.type)"
                          [style.border-left]="'3px solid ' + typeColor(e.type)"
                          style="position:absolute;left:4px;right:4px;padding:4px 6px;border-radius:4px;text-align:left;font-size:11px;font-weight:500;overflow:hidden;cursor:pointer;border-top:0;border-right:0;border-bottom:0">
                          <div style="font-weight:600">{{ e.title }}</div>
                          <div style="font-size:10px;opacity:0.85">{{ e.start | formatDate:'time' }}</div>
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }
          @case ('list') {
            <!-- LIST VIEW -->
            <div style="overflow-y:auto;padding:8px">
              @if (listGroups().length === 0) {
                <div style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px">Keine Events gefunden.</div>
              }
              @for (g of listGroups(); track g.key) {
                <div style="margin-bottom:10px">
                  <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;padding:6px 10px">
                    {{ g.date | formatDate:'weekday' }} · {{ g.date | formatDate:'date' }}
                  </div>
                  @for (e of g.events; track e.id) {
                    <button
                      type="button"
                      (click)="router.navigate([], { queryParams: { open: e.id }, queryParamsHandling: 'merge' })"
                      style="display:flex;align-items:center;gap:14px;width:100%;padding:10px 12px;border-radius:6px;text-align:left;background:transparent;border:0;cursor:pointer">
                      <span [style.background]="typeColor(e.type)" style="width:10px;height:10px;border-radius:50%;flex-shrink:0"></span>
                      <div style="font-size:13px;font-variant-numeric:tabular-nums;color:var(--text-muted);width:50px">{{ e.start | formatDate:'time' }}</div>
                      <div style="flex:1;min-width:0">
                        <div style="font-size:13px;font-weight:500">{{ e.title }}</div>
                        <div style="font-size:11px;color:var(--text-muted)">{{ e.location }}</div>
                      </div>
                      @if (teamFor(e); as t) {
                        <span class="chip" [style.background]="t.color + '18'" [style.color]="t.color" style="border-color:transparent">{{ t.short }}</span>
                      }
                      <div style="display:flex;align-items:center;gap:8px;min-width:120px">
                        <div style="flex:1;height:4px;background:var(--bg-subtle);border-radius:2px;overflow:hidden">
                          <div [style.width.%]="attendancePct(e)" style="height:100%;background:var(--success);transition:width .3s"></div>
                        </div>
                        <div style="font-size:11px;color:var(--text-muted);font-variant-numeric:tabular-nums;white-space:nowrap">{{ e.confirmed }}/{{ totalFor(e) }}</div>
                      </div>
                    </button>
                  }
                </div>
              }
            </div>
          }
        }
      </div>

      <!-- Legend -->
      <div style="display:flex;gap:16px;justify-content:center;font-size:11px;color:var(--text-muted)">
        @for (t of typeOptions; track t.k) {
          <div style="display:inline-flex;align-items:center;gap:6px">
            <span [style.background]="t.c" style="width:10px;height:10px;border-radius:2px"></span>
            {{ t.l }}
          </div>
        }
      </div>
    </div>

    <app-event-drawer />
  `,
})
export class EventsComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  constructor() {
    this.activatedRoute.queryParamMap.subscribe(qp => {
      const id = qp.get('open');
      if (id) {
        const e = this.data.events.find(x => x.id === id);
        if (e) this.state.openEvent(e);
      } else if (this.state.eventOpen()) {
        this.state.closeEvent();
      }
    });
  }

  view = signal<ViewMode>('month');
  refDate = signal<Date>((() => { const d = new Date(); d.setDate(1); return d; })());
  typeFilter = signal<Set<EventType>>(new Set<EventType>(['training', 'match', 'event']));
  teamFilter = '';

  readonly weekdayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  readonly hours = Array.from({ length: 15 }, (_, i) => 8 + i); // 8 - 22
  readonly viewModes: { k: ViewMode; l: string }[] = [
    { k: 'month', l: 'Monat' },
    { k: 'week', l: 'Woche' },
    { k: 'list', l: 'Liste' },
  ];
  readonly typeOptions: { k: EventType; l: string; c: string }[] = [
    { k: 'training', l: 'Training', c: 'var(--event-training)' },
    { k: 'match', l: 'Match', c: 'var(--event-match)' },
    { k: 'event', l: 'Event', c: 'var(--event-event)' },
  ];

  filteredEvents = computed(() => {
    const types = this.typeFilter();
    const team = this.teamFilter;
    return this.data.events.filter(e => types.has(e.type) && (team === '' || e.team === team));
  });

  monthLabel = computed(() =>
    this.refDate().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })
  );

  monthCells = computed(() => {
    const ref = this.refDate();
    const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const start = new Date(first);
    const dow = (first.getDay() + 6) % 7; // Monday = 0
    start.setDate(start.getDate() - dow);
    const eventsByDay = new Map<string, CalendarEvent[]>();
    for (const e of this.filteredEvents()) {
      const k = e.start.toDateString();
      const arr = eventsByDay.get(k) || [];
      arr.push(e);
      eventsByDay.set(k, arr);
    }
    const today = new Date().toDateString();
    const cells: { date: Date; inMonth: boolean; isToday: boolean; events: CalendarEvent[] }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = d.toDateString();
      const eventsForDay = (eventsByDay.get(k) || []).slice().sort((a, b) => a.start.getTime() - b.start.getTime());
      cells.push({
        date: d,
        inMonth: d.getMonth() === ref.getMonth(),
        isToday: k === today,
        events: eventsForDay,
      });
    }
    return cells;
  });

  weekDays = computed(() => {
    const ref = this.refDate();
    const start = new Date(ref);
    const dow = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dow);
    const today = new Date().toDateString();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dayEvents = this.filteredEvents()
        .filter(e => e.start.toDateString() === d.toDateString())
        .sort((a, b) => a.start.getTime() - b.start.getTime());
      return { date: d, isToday: d.toDateString() === today, events: dayEvents };
    });
  });

  listGroups = computed<DayGroup[]>(() => {
    const sorted = [...this.filteredEvents()].sort((a, b) => a.start.getTime() - b.start.getTime());
    const map = new Map<string, DayGroup>();
    for (const e of sorted) {
      const k = e.start.toDateString();
      if (!map.has(k)) map.set(k, { key: k, date: new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate()), events: [] });
      map.get(k)!.events.push(e);
    }
    return Array.from(map.values());
  });

  toggleType(t: EventType): void {
    const s = new Set(this.typeFilter());
    if (s.has(t)) s.delete(t); else s.add(t);
    this.typeFilter.set(s);
  }

  shift(delta: number): void {
    const d = new Date(this.refDate());
    if (this.view() === 'month') d.setMonth(d.getMonth() + delta);
    else if (this.view() === 'week') d.setDate(d.getDate() + delta * 7);
    else d.setDate(d.getDate() + delta);
    this.refDate.set(d);
  }

  goToday(): void {
    const d = new Date();
    if (this.view() === 'month') d.setDate(1);
    this.refDate.set(d);
  }

  typeColor(t: EventType): string {
    return t === 'match' ? 'var(--event-match)' : t === 'training' ? 'var(--event-training)' : 'var(--event-event)';
  }

  typeBg(t: EventType): string {
    return t === 'match' ? 'var(--event-match-bg)' : t === 'training' ? 'var(--event-training-bg)' : 'var(--event-event-bg)';
  }

  teamFor(e: CalendarEvent) {
    return this.data.getTeam(e.team);
  }

  totalFor(e: CalendarEvent): number {
    return e.confirmed + e.declined + e.pending;
  }

  attendancePct(e: CalendarEvent): number {
    const total = this.totalFor(e);
    return total === 0 ? 0 : Math.round((e.confirmed / total) * 100);
  }

  eventTop(e: CalendarEvent): number {
    const h = e.start.getHours() + e.start.getMinutes() / 60;
    return (h - 8) * 30;
  }

  eventHeight(e: CalendarEvent): number {
    return Math.max(20, (e.duration / 60) * 30);
  }

  padHour(h: number): string {
    return String(h).padStart(2, '0');
  }

  openEvent(ev: Event, e: CalendarEvent): void {
    ev.stopPropagation();
    this.router.navigate([], { queryParams: { open: e.id }, queryParamsHandling: 'merge' });
  }
}
