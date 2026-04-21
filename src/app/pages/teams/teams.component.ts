import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { AppStateService } from '../../core/services/app-state.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import { Team, Member } from '../../core/models';

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [FormsModule, UpperCasePipe, IconComponent, AvatarComponent, DrawerComponent, ModalComponent, ConfirmDialogComponent, FormatDatePipe],
  template: `
    <div class="page-content">
      <!-- Header -->
      <div style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em">Teams</h1>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">{{ data.teams.length }} Teams · {{ totalMembers() }} Mitglieder</div>
        </div>
        <div style="display:flex;gap:8px">
          <div style="display:flex;gap:0;background:var(--bg-subtle);border-radius:6px;padding:2px">
            <button (click)="view.set('grid')"
              [style.background]="view() === 'grid' ? 'var(--bg-elev)' : 'transparent'"
              [style.box-shadow]="view() === 'grid' ? 'var(--shadow-xs)' : 'none'"
              style="padding:5px 10px;border-radius:5px;font-size:12px;display:flex;align-items:center;gap:4px">
              <app-icon name="grid" [size]="12" /> Kacheln
            </button>
            <button (click)="view.set('list')"
              [style.background]="view() === 'list' ? 'var(--bg-elev)' : 'transparent'"
              [style.box-shadow]="view() === 'list' ? 'var(--shadow-xs)' : 'none'"
              style="padding:5px 10px;border-radius:5px;font-size:12px;display:flex;align-items:center;gap:4px">
              <app-icon name="list" [size]="12" /> Liste
            </button>
          </div>
          <button class="btn btn-primary" (click)="addTeamOpen.set(true)">
            <app-icon name="plus" [size]="13" /> Team erstellen
          </button>
        </div>
      </div>

      <!-- Grid / List -->
      @if (view() === 'grid') {
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
          @for (t of data.teams; track t.id) {
            <div class="card team-card" (click)="selectTeam(t)"
              style="overflow:hidden;cursor:pointer;transition:transform .12s, box-shadow .12s">
              <div [style.background]="t.color" style="height:64px;position:relative;display:flex;align-items:center;justify-content:space-between;padding:0 14px">
                <div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.02em">{{ t.short }}</div>
                <span style="font-size:10px;font-weight:600;color:#fff;background:rgba(255,255,255,0.22);padding:3px 7px;border-radius:4px;letter-spacing:0.04em">{{ t.category | uppercase }}</span>
              </div>
              <div style="padding:14px">
                <div style="font-size:15px;font-weight:600;margin-bottom:4px">{{ t.name }}</div>
                <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:5px;margin-bottom:12px">
                  <app-icon name="users" [size]="11" /> {{ t.memberCount }} Mitglieder
                </div>
                <div style="display:flex;align-items:center;gap:8px;padding-top:12px;border-top:1px solid var(--border)">
                  <app-avatar [name]="t.coach" size="sm" />
                  <div style="flex:1;min-width:0">
                    <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ t.coach }}</div>
                    <div style="font-size:10px;color:var(--text-muted)">Trainer</div>
                  </div>
                  <div style="font-size:11px;color:var(--text-muted);font-variant-numeric:tabular-nums">
                    {{ t.season.w }}S {{ t.season.d }}U {{ t.season.l }}N
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="card">
          <table class="tbl">
            <thead>
              <tr>
                <th>Team</th>
                <th>Kategorie</th>
                <th>Mitglieder</th>
                <th>Trainer</th>
                <th>Saison</th>
              </tr>
            </thead>
            <tbody>
              @for (t of data.teams; track t.id) {
                <tr (click)="selectTeam(t)" style="cursor:pointer">
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <div [style.background]="t.color" style="width:24px;height:24px;border-radius:6px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">{{ t.short }}</div>
                      <div style="font-weight:500">{{ t.name }}</div>
                    </div>
                  </td>
                  <td><span class="chip">{{ t.category }}</span></td>
                  <td>{{ t.memberCount }}</td>
                  <td>{{ t.coach }}</td>
                  <td style="font-variant-numeric:tabular-nums">{{ t.season.w }}S {{ t.season.d }}U {{ t.season.l }}N</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Team detail drawer -->
    <app-drawer [open]="!!selectedTeam()" [width]="640" (closed)="selectedTeam.set(null)">
      @if (selectedTeam(); as t) {
        <div style="padding:0;display:flex;flex-direction:column;height:100%">
          <div [style.background]="t.color" style="padding:28px 24px;color:#fff;position:relative">
            <button (click)="selectedTeam.set(null)" class="btn btn-ghost btn-icon"
              style="position:absolute;top:14px;right:14px;color:#fff">
              <app-icon name="x" [size]="16" />
            </button>
            <div style="display:flex;align-items:center;gap:14px">
              <div style="width:56px;height:56px;border-radius:12px;background:rgba(255,255,255,0.2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700">{{ t.short }}</div>
              <div>
                <div style="font-size:22px;font-weight:600;letter-spacing:-0.02em">{{ t.name }}</div>
                <div style="font-size:12px;opacity:0.9">{{ t.category }} · {{ t.memberCount }} Mitglieder</div>
              </div>
            </div>
          </div>

          <div style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px">
            <!-- Season card -->
            <div class="card" style="padding:16px">
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:10px">Saison 2025/26</div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
                <div style="text-align:center;padding:10px;background:var(--bg-subtle);border-radius:8px">
                  <div style="font-size:22px;font-weight:600">{{ t.season.games }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">Spiele</div>
                </div>
                <div style="text-align:center;padding:10px;background:var(--success-bg);border-radius:8px">
                  <div style="font-size:22px;font-weight:600;color:var(--success)">{{ t.season.w }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">Siege</div>
                </div>
                <div style="text-align:center;padding:10px;background:var(--warning-bg);border-radius:8px">
                  <div style="font-size:22px;font-weight:600;color:var(--warning)">{{ t.season.d }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">Unent.</div>
                </div>
                <div style="text-align:center;padding:10px;background:var(--danger-bg);border-radius:8px">
                  <div style="font-size:22px;font-weight:600;color:var(--danger)">{{ t.season.l }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">Nied.</div>
                </div>
              </div>
            </div>

            <!-- Staff -->
            <div class="card">
              <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                <div style="font-size:13px;font-weight:600">Staff</div>
                <button class="btn btn-ghost btn-sm" (click)="toast.show('Coach hinzugefügt')"><app-icon name="plus" [size]="12" /> Coach</button>
              </div>
              <div style="padding:10px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--border)">
                <app-avatar [name]="t.coach" size="md" />
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:500">{{ t.coach }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">Head Coach</div>
                </div>
              </div>
            </div>

            <!-- Roster -->
            <div class="card">
              <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                <div style="font-size:13px;font-weight:600">Kader ({{ roster().length }})</div>
                <button class="btn btn-sm" (click)="addPlayerOpen.set(true)"><app-icon name="userPlus" [size]="12" /> Spieler hinzufügen</button>
              </div>
              @for (m of roster().slice(0, 12); track m.id) {
                <div style="padding:8px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border)">
                  <app-avatar [name]="m.firstName + ' ' + m.lastName" size="sm" />
                  <div style="flex:1;font-size:13px">{{ m.firstName }} {{ m.lastName }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">{{ m.attendance }}% Anwesenheit</div>
                </div>
              }
              @if (roster().length > 12) {
                <div style="padding:10px 16px;font-size:12px;color:var(--text-muted);text-align:center">+ {{ roster().length - 12 }} weitere Spieler</div>
              }
            </div>

            <!-- Upcoming events -->
            <div class="card">
              <div style="padding:14px 16px;border-bottom:1px solid var(--border);font-size:13px;font-weight:600">Nächste Events</div>
              @for (e of upcomingEvents(); track e.id) {
                <div style="padding:10px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border)">
                  <div [style.background]="eventColor(e.type)" style="width:4px;height:32px;border-radius:2px"></div>
                  <div style="flex:1">
                    <div style="font-size:13px;font-weight:500">{{ e.title }}</div>
                    <div style="font-size:11px;color:var(--text-muted)">{{ e.start | formatDate:'weekday' }} {{ e.start | formatDate }} · {{ e.start | formatDate:'time' }}</div>
                  </div>
                </div>
              } @empty {
                <div style="padding:16px;font-size:12px;color:var(--text-muted);text-align:center">Keine anstehenden Events</div>
              }
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:8px">
              <button class="btn" style="flex:1;justify-content:center" (click)="editTeamOpen.set(true)"><app-icon name="edit" [size]="12" /> Bearbeiten</button>
              <button class="btn btn-danger" (click)="deleteConfirm.set(true)"><app-icon name="trash" [size]="12" /> Team löschen</button>
            </div>
          </div>
        </div>
      }
    </app-drawer>

    <!-- Create team modal -->
    <app-modal [open]="addTeamOpen()" title="Team erstellen" [width]="480" (closed)="addTeamOpen.set(false)">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label class="label">Name</label>
          <input class="input" [(ngModel)]="newTeam.name" placeholder="z.B. Junioren U13">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label class="label">Kategorie</label>
            <select class="select" [(ngModel)]="newTeam.category">
              <option>Aktive</option><option>Senioren</option><option>Junioren</option><option>Kinder</option><option>Damen</option>
            </select>
          </div>
          <div>
            <label class="label">Kürzel</label>
            <input class="input" [(ngModel)]="newTeam.short" maxlength="4" placeholder="U13">
          </div>
        </div>
        <div>
          <label class="label">Teamfarbe</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            @for (c of teamColors; track c) {
              <button (click)="newTeam.color = c" [style.background]="c"
                [style.border]="newTeam.color === c ? '2px solid var(--text)' : '2px solid transparent'"
                style="width:28px;height:28px;border-radius:6px;box-shadow:0 0 0 1px var(--border)"></button>
            }
          </div>
        </div>
      </div>
      <ng-container ngProjectAs="[slot=footer]">
        <button class="btn" (click)="addTeamOpen.set(false)">Abbrechen</button>
        <button class="btn btn-primary" (click)="createTeam()">Team erstellen</button>
      </ng-container>
    </app-modal>

    <!-- Edit team modal -->
    <app-modal [open]="editTeamOpen()" title="Team bearbeiten" [width]="480" (closed)="editTeamOpen.set(false)">
      @if (selectedTeam(); as t) {
        <div style="display:flex;flex-direction:column;gap:12px">
          <div><label class="label">Name</label><input class="input" [value]="t.name" readonly></div>
          <div><label class="label">Trainer</label><input class="input" [value]="t.coach"></div>
        </div>
      }
      <ng-container ngProjectAs="[slot=footer]">
        <button class="btn" (click)="editTeamOpen.set(false)">Abbrechen</button>
        <button class="btn btn-primary" (click)="editTeamOpen.set(false); toast.show({kind:'success', body:'Team aktualisiert'})">Speichern</button>
      </ng-container>
    </app-modal>

    <!-- Add player modal -->
    <app-modal [open]="addPlayerOpen()" title="Spieler hinzufügen" [width]="520" (closed)="addPlayerOpen.set(false)">
      <div style="margin-bottom:12px">
        <input class="input" [(ngModel)]="playerSearch" placeholder="Suche nach Name …">
      </div>
      <div style="max-height:400px;overflow-y:auto;display:flex;flex-direction:column;gap:4px">
        @for (m of availableMembers(); track m.id) {
          <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;cursor:pointer"
            (mouseenter)="hoverBg($event, 'var(--bg-subtle)')"
            (mouseleave)="hoverBg($event, 'transparent')">
            <input type="checkbox" [checked]="isSelected(m.id)" (change)="togglePlayer(m.id)">
            <app-avatar [name]="m.firstName + ' ' + m.lastName" size="sm" />
            <div style="flex:1">
              <div style="font-size:13px;font-weight:500">{{ m.firstName }} {{ m.lastName }}</div>
              <div style="font-size:11px;color:var(--text-muted)">{{ m.teams.length }} Teams</div>
            </div>
          </label>
        }
      </div>
      <ng-container ngProjectAs="[slot=footer]">
        <button class="btn" (click)="addPlayerOpen.set(false)">Abbrechen</button>
        <button class="btn btn-primary" (click)="confirmAddPlayers()">{{ selectedPlayers().size }} hinzufügen</button>
      </ng-container>
    </app-modal>

    <!-- Delete confirm -->
    <app-confirm-dialog
      [open]="deleteConfirm()"
      title="Team löschen?"
      body="Das Team wird entfernt. Mitglieder werden nicht gelöscht."
      confirmLabel="Team löschen"
      [danger]="true"
      (closed)="deleteConfirm.set(false)"
      (confirmed)="onDeleteTeam()" />
  `,
  styles: [`
    .team-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  `]
})
export class TeamsComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  view = signal<ViewMode>('grid');
  selectedTeam = signal<Team | null>(null);
  addTeamOpen = signal<boolean>(false);
  editTeamOpen = signal<boolean>(false);
  addPlayerOpen = signal<boolean>(false);
  deleteConfirm = signal<boolean>(false);
  playerSearch = '';
  selectedPlayers = signal<Set<string>>(new Set());

  teamColors = ['#DC2626','#EA580C','#F59E0B','#059669','#0891B2','#2563EB','#7C3AED','#DB2777'];
  newTeam = { name: '', category: 'Junioren', short: '', color: '#2563EB' };

  totalMembers = computed(() => this.data.teams.reduce((s, t) => s + t.memberCount, 0));

  roster = computed(() => {
    const t = this.selectedTeam();
    return t ? this.data.getMembersForTeam(t.id) : [];
  });

  upcomingEvents = computed(() => {
    const t = this.selectedTeam();
    if (!t) return [];
    const now = new Date();
    return this.data.events.filter(e => e.team === t.id && e.start > now).sort((a,b) => +a.start - +b.start).slice(0, 5);
  });

  availableMembers = computed(() => {
    const t = this.selectedTeam();
    if (!t) return [];
    const q = this.playerSearch.toLowerCase();
    return this.data.members.filter(m =>
      !m.teams.includes(t.id) &&
      (!q || `${m.firstName} ${m.lastName}`.toLowerCase().includes(q))
    ).slice(0, 50);
  });

  selectTeam(t: Team): void {
    this.selectedTeam.set(t);
  }

  eventColor(type: string): string {
    return type === 'training' ? 'var(--event-training)' : type === 'match' ? 'var(--event-match)' : 'var(--event-event)';
  }

  createTeam(): void {
    if (!this.newTeam.name) {
      this.toast.show({ kind: 'error', body: 'Bitte Name angeben.' });
      return;
    }
    this.addTeamOpen.set(false);
    this.toast.show({ kind: 'success', title: 'Team erstellt', body: this.newTeam.name });
    this.newTeam = { name: '', category: 'Junioren', short: '', color: '#2563EB' };
  }

  isSelected(id: string): boolean {
    return this.selectedPlayers().has(id);
  }

  togglePlayer(id: string): void {
    this.selectedPlayers.update(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  confirmAddPlayers(): void {
    const count = this.selectedPlayers().size;
    if (count === 0) { this.addPlayerOpen.set(false); return; }
    this.toast.show({ kind: 'success', body: `${count} Spieler dem Team zugewiesen` });
    this.selectedPlayers.set(new Set());
    this.playerSearch = '';
    this.addPlayerOpen.set(false);
  }

  onDeleteTeam(): void {
    const t = this.selectedTeam();
    if (t) {
      this.toast.show({ kind: 'warning', body: `Team "${t.name}" gelöscht` });
      this.selectedTeam.set(null);
    }
  }

  hoverBg(e: Event, bg: string): void {
    (e.currentTarget as HTMLElement).style.background = bg;
  }
}
