import { Component, inject, signal, computed, effect, viewChild, ElementRef, HostListener } from '@angular/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';
import { FormatDatePipe } from '../../pipes/format-date.pipe';

interface Result {
  kind: string;
  icon: string;
  label: string;
  sub: string;
  action: () => void;
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'members', label: 'Mitglieder', icon: 'users' },
  { id: 'teams', label: 'Teams', icon: 'ball' },
  { id: 'events', label: 'Trainings & Matches', icon: 'calendar' },
  { id: 'news', label: 'News & Berichte', icon: 'news' },
  { id: 'dues', label: 'Beiträge', icon: 'money' },
  { id: 'roles', label: 'Rollen & Rechte', icon: 'shield' },
  { id: 'settings', label: 'Einstellungen', icon: 'settings' },
];

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (state.cmdOpen()) {
      <div style="position:fixed;inset:0;z-index:70;display:flex;justify-content:center;align-items:flex-start;padding-top:10vh">
        <div (click)="close()" style="position:absolute;inset:0;background:rgba(12,10,9,0.5);animation:fadeIn .15s"></div>
        <div style="position:relative;width:640px;max-width:94vw;background:var(--bg-elev);border-radius:var(--r-lg);box-shadow:var(--shadow-xl);animation:slideInUp .18s">
          <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border)">
            <app-icon name="search" [size]="16" />
            <input #inp [value]="q()" (input)="q.set($any($event.target).value)" placeholder="Mitglieder, Events, Aktionen …"
              style="flex:1;border:0;background:transparent;outline:none;font-size:15px;color:var(--text)" />
            <span class="kbd">ESC</span>
          </div>
          <div style="max-height:420px;overflow-y:auto;padding:6px">
            @if (results().length === 0) {
              <div style="padding:20px;text-align:center;font-size:13px;color:var(--text-muted)">Keine Treffer</div>
            }
            @for (r of results(); track $index; let i = $index) {
              <button (click)="run(r)"
                [style.background]="i === 0 ? 'var(--bg-subtle)' : 'transparent'"
                style="display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border-radius:6px;text-align:left"
                (mouseenter)="hoverBg($event, 'var(--bg-subtle)')"
                (mouseleave)="hoverBg($event, i === 0 ? 'var(--bg-subtle)' : 'transparent')">
                <app-icon [name]="r.icon" [size]="16" />
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:500">{{ r.label }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">{{ r.sub }}</div>
                </div>
                @if (i === 0) { <span class="kbd">↵</span> }
              </button>
            }
          </div>
          <div style="padding:8px 12px;border-top:1px solid var(--border);display:flex;gap:12px;font-size:11px;color:var(--text-muted)">
            <span><span class="kbd">↑↓</span> navigieren</span>
            <span><span class="kbd">↵</span> öffnen</span>
            <span><span class="kbd">ESC</span> schliessen</span>
          </div>
        </div>
      </div>
    }
  `,
})
export class CommandPaletteComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  toast = inject(ToastService);
  datePipe = new FormatDatePipe();

  q = signal<string>('');
  inp = viewChild<ElementRef<HTMLInputElement>>('inp');

  constructor() {
    effect(() => {
      if (this.state.cmdOpen()) {
        this.q.set('');
        setTimeout(() => this.inp()?.nativeElement.focus(), 50);
      }
    });
  }

  results = computed<Result[]>(() => {
    const query = this.q().toLowerCase().trim();
    const pages: Result[] = NAV.map(n => ({ kind: 'page', icon: n.icon, label: n.label, sub: 'Seite', action: () => this.state.setPage(n.id) }));
    const members: Result[] = this.data.members.slice(0, 30).map(m => ({
      kind: 'member', icon: 'user',
      label: `${m.firstName} ${m.lastName}`,
      sub: m.email,
      action: () => { this.state.setPage('members'); this.toast.show('Mitglied geöffnet: ' + m.firstName + ' ' + m.lastName); },
    }));
    const events: Result[] = this.data.events.map(e => ({
      kind: 'event', icon: 'calendar',
      label: e.title,
      sub: this.datePipe.transform(e.start, 'datetime'),
      action: () => this.state.setPage('events'),
    }));
    const actions: Result[] = [
      { kind: 'action', icon: 'plus', label: 'Neues Mitglied einladen', sub: 'Aktion', action: () => this.state.setPage('members') },
      { kind: 'action', icon: 'plus', label: 'Neues Event erstellen', sub: 'Aktion', action: () => this.state.setPage('events') },
      { kind: 'action', icon: 'plus', label: 'News publizieren', sub: 'Aktion', action: () => this.state.setPage('news') },
    ];
    const all = [...actions, ...pages, ...members, ...events];
    if (!query) return all.slice(0, 8);
    return all.filter(x => x.label.toLowerCase().includes(query) || x.sub.toLowerCase().includes(query)).slice(0, 15);
  });

  close(): void { this.state.cmdOpen.set(false); }

  run(r: Result): void {
    r.action();
    this.close();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.state.cmdOpen()) return;
    if (e.key === 'Escape') { this.close(); return; }
    if (e.key === 'Enter') {
      const first = this.results()[0];
      if (first) { this.run(first); }
    }
  }

  hoverBg(e: Event, bg: string): void {
    (e.currentTarget as HTMLElement).style.background = bg;
  }
}
