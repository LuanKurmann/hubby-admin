import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { AppStateService } from '../../core/services/app-state.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { FormatChfPipe } from '../../shared/pipes/format-chf.pipe';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { ActivityItem, CalendarEvent, Team } from '../../core/models';

interface EventTone {
  bg: string;
  c: string;
  label: string;
}

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="card kpi-card">
      <div class="kpi-head">
        <div class="kpi-label">{{ label }}</div>
        <div class="kpi-icon-wrap">
          <app-icon [name]="icon" [size]="14" />
        </div>
      </div>
      <div class="kpi-value">{{ value }}</div>
      <div class="kpi-footer">
        @if (change) {
          <span class="kpi-change"
                [class.up]="changeKind === 'up'"
                [class.down]="changeKind === 'down'">
            <app-icon name="trending" [size]="12" [style.transform]="changeKind === 'down' ? 'scaleY(-1)' : 'none'" />
            {{ change }}
          </span>
        }
        <span class="kpi-sub">{{ sub }}</span>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg-elev);
    }
    .kpi-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .kpi-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .kpi-icon-wrap {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: var(--bg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }
    .kpi-value {
      font-size: 26px;
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .kpi-footer {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 12px;
    }
    .kpi-change {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-weight: 500;
      color: var(--text-muted);
    }
    .kpi-change.up { color: var(--success); }
    .kpi-change.down { color: var(--danger); }
    .kpi-sub { color: var(--text-muted); }
  `],
})
export class KpiCardComponent {
  label = '';
  value: string | number = '';
  change?: string;
  changeKind?: 'up' | 'down';
  icon = 'users';
  sub = '';

  static create(
    label: string,
    value: string | number,
    icon: string,
    sub: string,
    change?: string,
    changeKind?: 'up' | 'down',
  ): KpiCardComponent {
    const k = new KpiCardComponent();
    k.label = label;
    k.value = value;
    k.icon = icon;
    k.sub = sub;
    k.change = change;
    k.changeKind = changeKind;
    return k;
  }
}

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [IconComponent, FormatDatePipe],
  template: `
    @if (event) {
      <div class="card event-card">
        <div class="event-top">
          <div class="event-info">
            <div class="event-tags">
              <span class="event-chip"
                    [style.color]="tone.c"
                    [style.background]="tone.bg">
                {{ tone.label }}
              </span>
              @if (team) {
                <span class="chip team-chip">{{ team.short }}</span>
              }
            </div>
            <div class="event-title">{{ event.title }}</div>
            <div class="event-meta">
              <app-icon name="clock" [size]="11" />
              {{ event.start | formatDate:'weekday' }} {{ event.start | formatDate:'date' }} · {{ event.start | formatDate:'time' }}
            </div>
          </div>
        </div>
        <div>
          <div class="progress-info">
            <span><strong class="confirmed">{{ event.confirmed }}</strong>/{{ total }} zugesagt</span>
            <span>{{ event.declined }} abgesagt · {{ event.pending }} offen</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill"
                 [style.width.%]="pct"
                 [style.background]="tone.c"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .event-card {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg-elev);
    }
    .event-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }
    .event-info {
      min-width: 0;
      flex: 1;
    }
    .event-tags {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }
    .event-chip {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .team-chip {
      height: 18px;
      font-size: 10px;
      padding: 0 6px;
      display: inline-flex;
      align-items: center;
      border-radius: 4px;
      background: var(--bg-subtle);
      color: var(--text-muted);
    }
    .event-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .event-meta {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .confirmed { color: var(--text); }
    .progress-track {
      height: 4px;
      background: var(--bg-subtle);
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      transition: width .4s;
    }
  `],
})
export class EventCardComponent {
  event!: CalendarEvent;
  team?: Team;

  get total(): number {
    return this.event.confirmed + this.event.declined + this.event.pending;
  }
  get pct(): number {
    return this.total > 0 ? (this.event.confirmed / this.total) * 100 : 0;
  }
  get tone(): EventTone {
    const kind = this.event.type;
    if (kind === 'training') return { bg: 'var(--event-training-bg)', c: 'var(--event-training)', label: 'Training' };
    if (kind === 'match') return { bg: 'var(--event-match-bg)', c: 'var(--event-match)', label: 'Match' };
    return { bg: 'var(--event-event-bg)', c: 'var(--event-event)', label: 'Event' };
  }
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IconComponent, FormatChfPipe, FormatDatePipe, RelativeTimePipe],
  template: `
    <div class="dashboard">
      <div class="dash-head">
        <div>
          <h1 class="greet">{{ greeting }}, {{ firstName }}</h1>
          <div class="greet-sub">Hier ist, was bei {{ state.club().name }} läuft.</div>
        </div>
        <div class="actions">
          <button class="btn" (click)="addEvent()">
            <app-icon name="plus" [size]="13" /> Event
          </button>
          <button class="btn" (click)="addNews()">
            <app-icon name="plus" [size]="13" /> News
          </button>
          <button class="btn btn-primary" (click)="state.setPage('invites')">
            <app-icon name="key" [size]="13" /> Einladungscode
          </button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="card kpi-card">
          <div class="kpi-head">
            <div class="kpi-label">Aktive Mitglieder</div>
            <div class="kpi-icon-wrap"><app-icon name="users" [size]="14" /></div>
          </div>
          <div class="kpi-value">{{ mock.members.length }}</div>
          <div class="kpi-footer">
            <span class="kpi-change up">
              <app-icon name="trending" [size]="12" />
              +4
            </span>
            <span class="kpi-sub">diesen Monat</span>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-head">
            <div class="kpi-label">Offene Beiträge</div>
            <div class="kpi-icon-wrap"><app-icon name="money" [size]="14" /></div>
          </div>
          <div class="kpi-value">{{ openDues | formatChf }}</div>
          <div class="kpi-footer">
            <span class="kpi-change down">
              <app-icon name="trending" [size]="12" [style.transform]="'scaleY(-1)'" />
              {{ duesPct }}%
            </span>
            <span class="kpi-sub">von {{ totalDues | formatChf }}</span>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-head">
            <div class="kpi-label">Anstehende Events</div>
            <div class="kpi-icon-wrap"><app-icon name="calendar" [size]="14" /></div>
          </div>
          <div class="kpi-value">{{ upcomingAllCount }}</div>
          <div class="kpi-footer">
            <span class="kpi-sub">in den nächsten 30 Tagen</span>
          </div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-head">
            <div class="kpi-label">Abmeldungen</div>
            <div class="kpi-icon-wrap"><app-icon name="alert" [size]="14" /></div>
          </div>
          <div class="kpi-value">7</div>
          <div class="kpi-footer">
            <span class="kpi-change up">
              <app-icon name="trending" [size]="12" />
              +2
            </span>
            <span class="kpi-sub">diese Woche</span>
          </div>
        </div>
      </div>

      <div class="main-grid">
        <div class="left-col">
          <div class="card">
            <div class="card-head">
              <div class="card-title">Nächste Events</div>
              <button class="btn btn-ghost btn-sm" (click)="goEvents()">
                Alle anzeigen <app-icon name="chevronRight" [size]="12" />
              </button>
            </div>
            <div class="events-grid">
              @for (ev of upcoming; track ev.id) {
                <div class="event-slot">
                  <div class="card event-card">
                    <div class="event-tags">
                      <span class="event-chip"
                            [style.color]="toneFor(ev).c"
                            [style.background]="toneFor(ev).bg">
                        {{ toneFor(ev).label }}
                      </span>
                      @if (mock.getTeam(ev.team); as t) {
                        <span class="chip team-chip">{{ t.short }}</span>
                      }
                    </div>
                    <div class="event-title">{{ ev.title }}</div>
                    <div class="event-meta">
                      <app-icon name="clock" [size]="11" />
                      {{ ev.start | formatDate:'weekday' }} {{ ev.start | formatDate:'date' }} · {{ ev.start | formatDate:'time' }}
                    </div>
                    <div>
                      <div class="progress-info">
                        <span><strong class="confirmed">{{ ev.confirmed }}</strong>/{{ totalFor(ev) }} zugesagt</span>
                        <span>{{ ev.declined }} abgesagt · {{ ev.pending }} offen</span>
                      </div>
                      <div class="progress-track">
                        <div class="progress-fill"
                             [style.width.%]="pctFor(ev)"
                             [style.background]="toneFor(ev).c"></div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="sub-grid">
            <div class="card pad-card">
              <div class="sub-head">
                <div class="icon-bubble warning-bubble">
                  <app-icon name="money" [size]="16" />
                </div>
                <div class="sub-title">Jahresbeiträge 2026</div>
              </div>
              <div class="dues-value">
                {{ paidDues | formatChf }}
                <span class="dues-total">/ {{ totalDues | formatChf }}</span>
              </div>
              <div class="dues-track">
                <div class="dues-fill" [style.width.%]="paidPct"></div>
              </div>
              <div class="dues-meta">
                {{ paidMembers }}/{{ mock.members.length }} bezahlt · {{ paidPct }}%
              </div>
              <button class="btn btn-sm dues-btn" (click)="goDues()">Details ansehen</button>
            </div>

            <div class="card pad-card">
              <div class="sub-head">
                <div class="icon-bubble info-bubble">
                  <app-icon name="trophy" [size]="16" />
                </div>
                <div class="sub-title">Saison-Form</div>
              </div>
              <div class="teams-list">
                @for (t of topTeams; track t.id) {
                  <div class="team-row">
                    <div class="team-dot" [style.background]="t.color"></div>
                    <div class="team-name">{{ t.name }}</div>
                    <div class="team-stats">{{ t.season.w }}S {{ t.season.d }}U {{ t.season.l }}N</div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="card activity-card">
          <div class="activity-head">
            <div class="sub-title">Aktivität</div>
            <div class="live">
              <span class="pulse-dot"></span>
              Live
            </div>
          </div>
          <div class="activity-list">
            @for (a of activity(); track a.id; let last = $last) {
              <div class="activity-item" [class.slide-in]="a.live" [class.no-border]="last">
                <div class="act-icon" [style.color]="a.color">{{ a.icon }}</div>
                <div class="act-body">
                  <div class="act-text">{{ a.text }}</div>
                  <div class="act-time">{{ a.minsAgo | relativeTime }}</div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .dash-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .greet {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .greet-sub {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .actions .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .card {
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 10px;
    }
    .kpi-card {
      padding: 16px;
    }
    .kpi-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .kpi-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .kpi-icon-wrap {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: var(--bg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
    }
    .kpi-value {
      font-size: 26px;
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .kpi-footer {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 12px;
    }
    .kpi-change {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-weight: 500;
    }
    .kpi-change.up { color: var(--success); }
    .kpi-change.down { color: var(--danger); }
    .kpi-sub { color: var(--text-muted); }

    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
    }
    .left-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card-head {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-title {
      font-size: 13px;
      font-weight: 600;
    }
    .events-grid {
      padding: 14px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .event-slot .event-card {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .event-tags {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }
    .event-chip {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .chip.team-chip {
      height: 18px;
      font-size: 10px;
      padding: 0 6px;
      display: inline-flex;
      align-items: center;
      border-radius: 4px;
      background: var(--bg-subtle);
      color: var(--text-muted);
    }
    .event-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .event-meta {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .confirmed {
      color: var(--text);
    }
    .progress-track {
      height: 4px;
      background: var(--bg-subtle);
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      transition: width .4s;
    }
    .sub-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .pad-card {
      padding: 16px;
    }
    .sub-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .icon-bubble {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .warning-bubble {
      background: var(--warning-bg);
      color: var(--warning);
    }
    .info-bubble {
      background: var(--info-bg);
      color: var(--info);
    }
    .sub-title {
      font-size: 13px;
      font-weight: 600;
    }
    .dues-value {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .dues-total {
      font-size: 13px;
      font-weight: 400;
      color: var(--text-muted);
    }
    .dues-track {
      height: 6px;
      background: var(--bg-subtle);
      border-radius: 3px;
      margin-top: 10px;
      overflow: hidden;
    }
    .dues-fill {
      height: 100%;
      background: var(--success);
    }
    .dues-meta {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 8px;
    }
    .dues-btn {
      margin-top: 12px;
    }
    .teams-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .team-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .team-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .team-name {
      font-size: 12px;
      flex: 1;
      font-weight: 500;
    }
    .team-stats {
      font-size: 11px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }
    .activity-card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .activity-head {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .live {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--success);
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--success);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }
    .activity-list {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;
    }
    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
    }
    .activity-item.no-border {
      border-bottom: none;
    }
    .act-icon {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--bg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .act-body {
      flex: 1;
      min-width: 0;
    }
    .act-text {
      font-size: 12.5px;
      line-height: 1.45;
    }
    .act-time {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    @keyframes slideIn {
      from { transform: translateX(-8px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .slide-in {
      animation: slideIn .3s ease-out;
    }
  `],
})
export class DashboardComponent implements OnInit, OnDestroy {
  state = inject(AppStateService);
  mock = inject(MockDataService);

  private tickId: number | null = null;

  activity = signal<ActivityItem[]>([]);

  get firstName(): string {
    return this.state.user().name.split(' ')[0];
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 11) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  }

  get upcoming(): CalendarEvent[] {
    const now = new Date();
    return [...this.mock.events]
      .filter(e => e.start > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 3);
  }

  get upcomingAllCount(): number {
    const now = new Date();
    return this.mock.events.filter(e => e.start > now).length;
  }

  get paidMembers(): number {
    return this.mock.members.filter(m => m.paid).length;
  }

  get openDues(): number {
    return this.mock.members.reduce((s, m) => s + (m.paid ? 0 : m.dueAmount), 0);
  }

  get totalDues(): number {
    return this.mock.members.reduce((s, m) => s + (m.paid ? 250 : m.dueAmount), 0);
  }

  get paidDues(): number {
    return this.totalDues - this.openDues;
  }

  get paidPct(): number {
    if (this.totalDues === 0) return 0;
    return Math.round((this.paidDues / this.totalDues) * 100);
  }

  get duesPct(): number {
    if (this.totalDues === 0) return 0;
    return Math.round((this.openDues / this.totalDues) * 100);
  }

  get topTeams(): Team[] {
    return this.mock.teams.slice(0, 4);
  }

  ngOnInit(): void {
    this.activity.set(this.mock.activity.slice(0, 10));
    this.tickId = window.setInterval(() => this.pushActivity(), 12000);
  }

  ngOnDestroy(): void {
    if (this.tickId !== null) {
      clearInterval(this.tickId);
    }
  }

  private pushActivity(): void {
    const templates = [
      (n: string) => ({ icon: '✓', color: 'var(--success)', text: `${n} hat sich für Training (Mi 19:30) angemeldet` }),
      (n: string) => ({ icon: '✕', color: 'var(--warning)', text: `${n} hat sich vom Training abgemeldet: verletzt` }),
      (n: string) => ({ icon: '💰', color: 'var(--info)', text: `${n} hat Jahresbeitrag bezahlt: CHF 250.00` }),
    ];
    const m = this.mock.members[Math.floor(Math.random() * this.mock.members.length)];
    const name = `${m.firstName} ${m.lastName.charAt(0)}.`;
    const tpl = templates[Math.floor(Math.random() * templates.length)](name);
    const next: ActivityItem = {
      id: 'live' + Date.now(),
      icon: tpl.icon,
      color: tpl.color,
      text: tpl.text,
      minsAgo: 0,
      live: true,
    };
    this.activity.update(prev => [next, ...prev].slice(0, 10));
  }

  toneFor(ev: CalendarEvent): EventTone {
    if (ev.type === 'training') return { bg: 'var(--event-training-bg)', c: 'var(--event-training)', label: 'Training' };
    if (ev.type === 'match') return { bg: 'var(--event-match-bg)', c: 'var(--event-match)', label: 'Match' };
    return { bg: 'var(--event-event-bg)', c: 'var(--event-event)', label: 'Event' };
  }

  totalFor(ev: CalendarEvent): number {
    return ev.confirmed + ev.declined + ev.pending;
  }

  pctFor(ev: CalendarEvent): number {
    const t = this.totalFor(ev);
    return t > 0 ? (ev.confirmed / t) * 100 : 0;
  }

  addEvent(): void {
    this.state.addEventOpen.set(true);
  }

  addNews(): void {
    this.state.addNewsOpen.set(true);
  }

  goEvents(): void {
    this.state.setPage('events');
  }

  goDues(): void {
    this.state.setPage('dues');
  }
}
