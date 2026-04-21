import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService } from '../../core/services/app-state.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import { CalendarEvent, Member } from '../../core/models';

@Component({
  selector: 'app-event-drawer',
  standalone: true,
  imports: [FormsModule, DrawerComponent, ModalComponent, IconComponent, AvatarComponent, FormatDatePipe],
  template: `
    <app-drawer [open]="!!state.eventOpen()" [width]="720" (closed)="closeDrawer()">
      @if (state.eventOpen(); as event) {
        <!-- Header -->
        <div style="padding:20px;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div [style.background]="typeColor(event.type)" style="width:6px;align-self:stretch;border-radius:3px"></div>
            <div style="flex:1;min-width:0">
              <div [style.color]="typeColor(event.type)" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">
                {{ typeLabel(event.type) }}
              </div>
              <h2 style="margin:4px 0 8px;font-size:20px;font-weight:600;letter-spacing:-0.02em">{{ event.title }}</h2>
              <div style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--text-muted);align-items:center">
                <span style="display:inline-flex;align-items:center;gap:4px"><app-icon name="clock" [size]="11" /> {{ event.start | formatDate:'datetime' }}</span>
                <span style="display:inline-flex;align-items:center;gap:4px"><app-icon name="mapPin" [size]="11" /> {{ event.location }}</span>
                <span style="display:inline-flex;align-items:center;gap:4px"><app-icon name="clock" [size]="11" /> {{ event.duration }} Min</span>
                @if (team(); as t) {
                  <span class="chip" [style.background]="t.color + '18'" [style.color]="t.color" style="border-color:transparent">{{ t.name }}</span>
                }
              </div>
            </div>
            <button class="btn btn-ghost btn-icon" type="button" (click)="closeDrawer()">
              <app-icon name="x" [size]="16" />
            </button>
          </div>
        </div>

        <!-- Info card with stats -->
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);background:var(--bg-subtle);display:flex;gap:20px">
          <div>
            <div style="font-size:11px;color:var(--text-muted)">Teilnahme</div>
            <div style="font-size:18px;font-weight:600">{{ attendancePct(event) }}%</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">Gesamt</div>
            <div style="font-size:18px;font-weight:600">{{ totalFor(event) }}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">Zugesagt</div>
            <div style="font-size:18px;font-weight:600;color:var(--success)">{{ event.confirmed }}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">Abgesagt</div>
            <div style="font-size:18px;font-weight:600;color:var(--danger)">{{ event.declined }}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">Ausstehend</div>
            <div style="font-size:18px;font-weight:600;color:var(--text-muted)">{{ event.pending }}</div>
          </div>
        </div>

        <!-- 3-column attendance -->
        <div style="flex:1;overflow:hidden;display:flex;min-height:0">
          <!-- Zugesagt -->
          <div style="flex:1;border-right:1px solid var(--border);display:flex;flex-direction:column;min-width:0">
            <div style="padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg-subtle)">
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:16px;height:16px;border-radius:50%;background:var(--success);color:#fff;display:flex;align-items:center;justify-content:center">
                  <app-icon name="check" [size]="9" [stroke]="3" />
                </div>
                <div style="font-size:12px;font-weight:600">Zugesagt</div>
                <div style="font-size:11px;color:var(--text-muted)">· {{ event.confirmed }}</div>
              </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:4px">
              @for (m of confirmedList(); track m.id) {
                <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px">
                  <app-avatar [name]="m.firstName + ' ' + m.lastName" size="sm" />
                  <div style="font-size:12px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    {{ m.firstName }} {{ m.lastName }}
                  </div>
                </div>
              }
              @if (confirmedList().length === 0) {
                <div style="padding:20px;text-align:center;font-size:11px;color:var(--text-faint)">–</div>
              }
            </div>
          </div>

          <!-- Abgesagt -->
          <div style="flex:1;border-right:1px solid var(--border);display:flex;flex-direction:column;min-width:0">
            <div style="padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg-subtle)">
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:16px;height:16px;border-radius:50%;background:var(--danger);color:#fff;display:flex;align-items:center;justify-content:center">
                  <app-icon name="x" [size]="9" [stroke]="3" />
                </div>
                <div style="font-size:12px;font-weight:600">Abgesagt</div>
                <div style="font-size:11px;color:var(--text-muted)">· {{ event.declined }}</div>
              </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:4px">
              @for (m of declinedList(); track m.id; let i = $index) {
                <div style="padding:6px 8px;border-radius:4px">
                  <div style="display:flex;align-items:center;gap:8px">
                    <app-avatar [name]="m.firstName + ' ' + m.lastName" size="sm" />
                    <div style="font-size:12px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                      {{ m.firstName }} {{ m.lastName }}
                    </div>
                  </div>
                  @if (declineReason(i); as r) {
                    <div style="margin-left:32px;font-size:11px;color:var(--text-muted);font-style:italic;margin-top:2px">„{{ r }}"</div>
                  }
                </div>
              }
              @if (declinedList().length === 0) {
                <div style="padding:20px;text-align:center;font-size:11px;color:var(--text-faint)">–</div>
              }
            </div>
          </div>

          <!-- Ausstehend -->
          <div style="flex:1;display:flex;flex-direction:column;min-width:0">
            <div style="padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg-subtle)">
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:16px;height:16px;border-radius:50%;background:var(--text-muted);color:#fff;display:flex;align-items:center;justify-content:center">
                  <app-icon name="questionCircle" [size]="9" [stroke]="3" />
                </div>
                <div style="font-size:12px;font-weight:600">Ausstehend</div>
                <div style="font-size:11px;color:var(--text-muted)">· {{ event.pending }}</div>
              </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:4px">
              @for (m of pendingList(); track m.id) {
                <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px">
                  <app-avatar [name]="m.firstName + ' ' + m.lastName" size="sm" />
                  <div style="font-size:12px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    {{ m.firstName }} {{ m.lastName }}
                  </div>
                </div>
              }
              @if (pendingList().length === 0) {
                <div style="padding:20px;text-align:center;font-size:11px;color:var(--text-faint)">–</div>
              }
            </div>
          </div>
        </div>

        <!-- Actions footer -->
        <div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap">
          <div style="display:flex;gap:8px">
            <button class="btn" type="button" (click)="sendReminder()">
              <app-icon name="bell" [size]="13" /> Erinnerung senden
            </button>
            <button class="btn" type="button">
              <app-icon name="edit" [size]="13" /> Bearbeiten
            </button>
            <button class="btn btn-ghost" type="button" style="color:var(--danger)" (click)="deleteEvent()">
              <app-icon name="trash" [size]="13" />
            </button>
          </div>
          <button class="btn btn-primary" type="button" (click)="markDone(event)">
            <app-icon name="trophy" [size]="13" />
            {{ event.type === 'match' ? 'Als durchgeführt markieren' : 'Durchgeführt' }}
          </button>
        </div>
      }
    </app-drawer>

    <!-- Match report modal -->
    <app-modal [open]="matchReportOpen()" title="Matchbericht" [width]="520" (closed)="matchReportOpen.set(false)">
      @if (state.eventOpen(); as event) {
        <div style="display:flex;flex-direction:column;gap:14px">
          <div style="padding:12px;background:var(--bg-subtle);border-radius:6px;font-size:12px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Match</div>
            <div style="font-weight:600">{{ event.title }} · {{ event.start | formatDate:'date' }}</div>
          </div>
          <div>
            <label class="label">Resultat</label>
            <div style="display:flex;align-items:center;gap:12px;justify-content:center">
              <div style="text-align:center">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Heim</div>
                <input class="input" type="number" [(ngModel)]="homeScore" style="width:60px;font-size:20px;font-weight:600;text-align:center;height:52px" />
              </div>
              <div style="font-size:22px;font-weight:600;color:var(--text-muted)">:</div>
              <div style="text-align:center">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Auswärts</div>
                <input class="input" type="number" [(ngModel)]="awayScore" style="width:60px;font-size:20px;font-weight:600;text-align:center;height:52px" />
              </div>
            </div>
          </div>
          <div>
            <label class="label">
              Kurzbericht
              <span style="color:var(--text-muted);font-weight:400">(max. 500 Zeichen, {{ summary().length }}/500)</span>
            </label>
            <textarea class="textarea" rows="4" maxlength="500" placeholder="Wie lief das Spiel?"
              [ngModel]="summary()" (ngModelChange)="summary.set($event)"></textarea>
          </div>
        </div>
      }
      <ng-container slot="footer">
        <button class="btn" type="button" (click)="matchReportOpen.set(false)">Abbrechen</button>
        <button class="btn btn-primary" type="button" (click)="publishReport()">Publizieren</button>
      </ng-container>
    </app-modal>
  `,
})
export class EventDrawerComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  toast = inject(ToastService);
  router = inject(Router);

  closeDrawer(): void {
    this.state.closeEvent();
    this.router.navigate([], { queryParams: { open: null }, queryParamsHandling: 'merge' });
  }

  matchReportOpen = signal<boolean>(false);
  homeScore = 0;
  awayScore = 0;
  summary = signal<string>('');

  private readonly declineReasons = [
    'Verletzt',
    'Ferien',
    'Arbeit',
    'Familienfeier',
    'Krank',
    'Prüfung',
  ];

  private pool = computed<Member[]>(() => {
    const e = this.state.eventOpen();
    if (!e) return [];
    if (e.team) return this.data.getMembersForTeam(e.team);
    return this.data.members.slice(0, 60);
  });

  confirmedList = computed<Member[]>(() => {
    const e = this.state.eventOpen();
    if (!e) return [];
    return this.pool().slice(0, Math.min(e.confirmed, this.pool().length));
  });

  declinedList = computed<Member[]>(() => {
    const e = this.state.eventOpen();
    if (!e) return [];
    const start = Math.min(e.confirmed, this.pool().length);
    return this.pool().slice(start, Math.min(start + e.declined, this.pool().length));
  });

  pendingList = computed<Member[]>(() => {
    const e = this.state.eventOpen();
    if (!e) return [];
    const start = Math.min(e.confirmed + e.declined, this.pool().length);
    return this.pool().slice(start, Math.min(start + e.pending, this.pool().length));
  });

  team = computed(() => {
    const e = this.state.eventOpen();
    return e ? this.data.getTeam(e.team) : undefined;
  });

  typeColor(t: string): string {
    return t === 'match' ? 'var(--event-match)' : t === 'training' ? 'var(--event-training)' : 'var(--event-event)';
  }

  typeLabel(t: string): string {
    return t === 'match' ? 'Match' : t === 'training' ? 'Training' : 'Event';
  }

  totalFor(e: CalendarEvent): number {
    return e.confirmed + e.declined + e.pending;
  }

  attendancePct(e: CalendarEvent): number {
    const total = this.totalFor(e);
    return total === 0 ? 0 : Math.round((e.confirmed / total) * 100);
  }

  declineReason(i: number): string | null {
    return i < 3 ? this.declineReasons[i % this.declineReasons.length] : null;
  }

  sendReminder(): void {
    this.toast.show({ kind: 'success', title: 'Erinnerung versendet', body: 'Alle ausstehenden Mitglieder wurden benachrichtigt.' });
  }

  markDone(event: CalendarEvent): void {
    if (event.type === 'match') {
      this.matchReportOpen.set(true);
    } else {
      this.toast.show({ kind: 'success', body: 'Event als durchgeführt markiert.' });
    }
  }

  publishReport(): void {
    this.matchReportOpen.set(false);
    this.toast.show({ kind: 'success', title: 'Matchbericht publiziert', body: 'Der Bericht ist jetzt veröffentlicht.' });
    this.summary.set('');
  }

  deleteEvent(): void {
    this.toast.show({ kind: 'warning', body: 'Event gelöscht.' });
    this.closeDrawer();
  }
}
