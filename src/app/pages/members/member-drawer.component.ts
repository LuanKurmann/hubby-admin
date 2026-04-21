import { Component, computed, inject, signal } from '@angular/core';
import { AppStateService } from '../../core/services/app-state.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { Member, Team } from '../../core/models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { FormatChfPipe } from '../../shared/pipes/format-chf.pipe';

interface DueEntry {
  date: string;
  label: string;
  amount: number;
  paid: boolean;
}

interface ActivityEntry {
  icon: string;
  color: string;
  text: string;
  time: string;
}

type TabId = 'profil' | 'beitraege' | 'aktivitaet';

@Component({
  selector: 'app-member-drawer',
  standalone: true,
  imports: [
    IconComponent,
    AvatarComponent,
    DrawerComponent,
    ConfirmDialogComponent,
    FormatChfPipe,
  ],
  template: `
    <app-drawer [open]="!!member()" [width]="560" (closed)="close()">
      @if (member(); as m) {
        <!-- Header -->
        <div style="padding:20px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:14px">
          <app-avatar [name]="m.firstName + ' ' + m.lastName" size="xl" />
          <div style="flex:1;min-width:0">
            <div style="font-size:18px;font-weight:600;letter-spacing:-0.01em">
              {{ m.firstName }} {{ m.lastName }}
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
              Mitglied seit {{ m.joined }}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
              @for (r of memberRoles(); track r.id) {
                <span class="chip">
                  <app-icon name="shield" [size]="10" /> {{ r.name }}
                </span>
              }
              @for (t of memberTeams(); track t.id) {
                <span class="chip"
                  [style.background]="t.color + '18'"
                  [style.color]="t.color"
                  style="border-color:transparent">{{ t.short }} · {{ t.name }}</span>
              }
              @if (m.paid) {
                <span class="badge badge-success">
                  <app-icon name="check" [size]="10" /> Beitrag bezahlt
                </span>
              } @else {
                <span class="badge badge-danger">
                  {{ m.dueAmount | formatChf }} offen
                </span>
              }
            </div>
          </div>
          <button class="btn btn-ghost btn-icon" (click)="close()" title="Schliessen">
            <app-icon name="x" [size]="16" />
          </button>
        </div>

        <!-- Tabs -->
        <div style="display:flex;gap:2px;padding:0 20px;border-bottom:1px solid var(--border);flex-shrink:0">
          @for (t of tabs; track t.id) {
            <button
              (click)="tab.set(t.id)"
              [style.color]="tab() === t.id ? 'var(--text)' : 'var(--text-muted)'"
              [style.borderBottom]="tab() === t.id ? '2px solid var(--primary)' : '2px solid transparent'"
              style="padding:10px 14px;background:transparent;border:0;font-size:13px;font-weight:500;cursor:pointer;margin-bottom:-1px">
              {{ t.label }}
            </button>
          }
        </div>

        <!-- Body -->
        <div style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:20px">
          @if (tab() === 'profil') {
            <!-- Kontakt -->
            <section class="card" style="padding:14px">
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:10px">
                Kontakt
              </div>
              <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
                <app-icon name="mail" [size]="14" style="color:var(--text-muted)" />
                <div style="font-size:12px;color:var(--text-muted);width:100px">E-Mail</div>
                <div style="font-size:13px;flex:1">
                  <a [href]="'mailto:' + m.email" style="color:var(--text)">{{ m.email }}</a>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
                <app-icon name="phone" [size]="14" style="color:var(--text-muted)" />
                <div style="font-size:12px;color:var(--text-muted);width:100px">Telefon</div>
                <div style="font-size:13px;flex:1">{{ m.phone }}</div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
                <app-icon name="mapPin" [size]="14" style="color:var(--text-muted)" />
                <div style="font-size:12px;color:var(--text-muted);width:100px">Adresse</div>
                <div style="font-size:13px;flex:1">{{ m.address }}, {{ m.zip }} {{ m.city }}</div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;padding:6px 0">
                <app-icon name="calendar" [size]="14" style="color:var(--text-muted)" />
                <div style="font-size:12px;color:var(--text-muted);width:100px">Geburtsdatum</div>
                <div style="font-size:13px;flex:1">{{ m.birthDate }}</div>
              </div>
            </section>

            <!-- Team-Zugehörigkeiten -->
            <section class="card" style="padding:14px">
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:10px">
                Team-Zugehörigkeiten
              </div>
              @if (memberTeams().length === 0) {
                <div style="font-size:12px;color:var(--text-muted)">Keine Teams zugeordnet.</div>
              } @else {
                <div style="display:flex;flex-direction:column;gap:6px">
                  @for (t of memberTeams(); track t.id) {
                    <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg-subtle);border-radius:6px">
                      <div
                        [style.background]="t.color"
                        style="width:28px;height:28px;border-radius:6px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">
                        {{ t.short }}
                      </div>
                      <div style="flex:1">
                        <div style="font-size:13px;font-weight:500">{{ t.name }}</div>
                        <div style="font-size:11px;color:var(--text-muted)">Trainer: {{ t.coach }}</div>
                      </div>
                      <span class="chip">{{ t.category }}</span>
                    </div>
                  }
                </div>
              }
            </section>

            <!-- Rollen & Rechte -->
            <section class="card" style="padding:14px">
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:10px;display:flex;justify-content:space-between">
                <span>Rollen & Rechte</span>
                <span style="font-weight:500;text-transform:none;letter-spacing:0">{{ memberRoles().length }} {{ memberRoles().length === 1 ? 'Rolle' : 'Rollen' }}</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                @for (r of memberRoles(); track r.id) {
                  <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg-subtle);border-radius:6px">
                    <div style="width:32px;height:32px;border-radius:8px;background:var(--primary-subtle);color:var(--primary);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                      <app-icon name="shield" [size]="14" />
                    </div>
                    <div style="flex:1;min-width:0">
                      <div style="font-size:13px;font-weight:500">{{ r.name }}</div>
                      <div style="font-size:11px;color:var(--text-muted)">{{ r.description }}</div>
                    </div>
                  </div>
                }
                @if (memberRoles().length === 0) {
                  <div style="padding:12px;text-align:center;font-size:12px;color:var(--text-muted)">Keine Rollen zugewiesen</div>
                }
              </div>
            </section>

            <!-- Stats: Anwesenheit + Mitglied seit -->
            <section class="card" style="padding:14px">
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:10px">
                Statistiken
              </div>
              <div style="display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center">
                <!-- Progress ring -->
                <div style="position:relative;width:92px;height:92px">
                  <svg width="92" height="92" viewBox="0 0 92 92" style="transform:rotate(-90deg)">
                    <circle cx="46" cy="46" r="40" fill="none" stroke="var(--bg-subtle)" stroke-width="8" />
                    <circle cx="46" cy="46" r="40" fill="none"
                      [attr.stroke]="attendanceColor()"
                      stroke-width="8"
                      stroke-linecap="round"
                      [attr.stroke-dasharray]="circumference"
                      [attr.stroke-dashoffset]="attendanceOffset()" />
                  </svg>
                  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column">
                    <div style="font-size:20px;font-weight:600;letter-spacing:-0.02em">{{ m.attendance }}%</div>
                    <div style="font-size:10px;color:var(--text-muted)">Anwesend</div>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px">
                  <div>
                    <div style="font-size:11px;color:var(--text-muted)">Anwesenheit (Saison)</div>
                    <div style="height:6px;background:var(--bg-subtle);border-radius:3px;overflow:hidden;margin-top:4px">
                      <div
                        [style.width.%]="m.attendance"
                        [style.background]="attendanceColor()"
                        style="height:100%"></div>
                    </div>
                  </div>
                  <div style="display:flex;justify-content:space-between;gap:10px">
                    <div>
                      <div style="font-size:11px;color:var(--text-muted)">Mitglied seit</div>
                      <div style="font-size:13px;font-weight:500">{{ m.joined }}</div>
                    </div>
                    <div>
                      <div style="font-size:11px;color:var(--text-muted)">Letztes Login</div>
                      <div style="font-size:13px;font-weight:500">{{ m.lastLogin }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          }

          @if (tab() === 'beitraege') {
            <section>
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:10px">
                Beitragshistorie
              </div>
              <div style="border-left:2px solid var(--border);padding-left:16px;margin-left:4px;display:flex;flex-direction:column;gap:14px">
                @for (d of dues(); track d.date) {
                  <div style="position:relative">
                    <div
                      [style.background]="d.paid ? 'var(--success)' : 'var(--warning)'"
                      style="position:absolute;left:-22px;top:4px;width:10px;height:10px;border-radius:50%;border:2px solid var(--bg-elev);box-shadow:0 0 0 2px currentColor"></div>
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
                      <div>
                        <div style="font-size:13px;font-weight:500">{{ d.label }}</div>
                        <div style="font-size:11px;color:var(--text-muted)">{{ d.date }}</div>
                      </div>
                      <div style="text-align:right">
                        <div style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">
                          {{ d.amount | formatChf }}
                        </div>
                        @if (d.paid) {
                          <span class="badge badge-success" style="margin-top:2px">Bezahlt</span>
                        } @else {
                          <span class="badge badge-danger" style="margin-top:2px">Offen</span>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          @if (tab() === 'aktivitaet') {
            <section>
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:10px">
                Aktivität
              </div>
              <div style="display:flex;flex-direction:column;gap:10px">
                @for (a of activity(); track $index) {
                  <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--bg-subtle);border-radius:6px">
                    <div
                      [style.background]="a.color + '22'"
                      [style.color]="a.color"
                      style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">
                      {{ a.icon }}
                    </div>
                    <div style="flex:1;min-width:0">
                      <div style="font-size:13px">{{ a.text }}</div>
                      <div style="font-size:11px;color:var(--text-muted);margin-top:2px">{{ a.time }}</div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }
        </div>

        <!-- Footer actions -->
        <div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;flex-shrink:0">
          <button class="btn" (click)="edit()">
            <app-icon name="edit" [size]="13" /> Bearbeiten
          </button>
          <button class="btn btn-danger" (click)="confirmDelete.set(true)">
            <app-icon name="trash" [size]="13" /> Entfernen
          </button>
        </div>
      }
    </app-drawer>

    <app-confirm-dialog
      [open]="confirmDelete()"
      [title]="confirmTitle()"
      body="Dies kann nicht rückgängig gemacht werden. Das Mitglied wird aus allen Teams entfernt."
      confirmLabel="Entfernen"
      [danger]="true"
      (closed)="confirmDelete.set(false)"
      (confirmed)="doDelete()" />
  `,
})
export class MemberDrawerComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  tab = signal<TabId>('profil');
  confirmDelete = signal<boolean>(false);

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'profil', label: 'Profil' },
    { id: 'beitraege', label: 'Beiträge' },
    { id: 'aktivitaet', label: 'Aktivität' },
  ];

  // Progress ring geometry
  readonly circumference = 2 * Math.PI * 40; // r=40

  member = computed<Member | null>(() => this.state.memberOpen());

  memberTeams = computed<Team[]>(() => {
    const m = this.member();
    if (!m) return [];
    return m.teams
      .map(id => this.data.getTeam(id))
      .filter((t): t is Team => !!t);
  });

  memberRoles = computed(() => {
    const m = this.member();
    if (!m) return [];
    return m.roleIds
      .map(id => this.data.getRole(id))
      .filter((r): r is NonNullable<typeof r> => !!r);
  });

  roleName = computed<string>(() => this.memberRoles().map(r => r.name).join(', '));

  roleDescription = computed<string>(() => this.memberRoles().map(r => r.description).join(' · '));

  attendanceColor = computed(() => {
    const a = this.member()?.attendance ?? 0;
    if (a > 75) return 'var(--success)';
    if (a > 50) return 'var(--warning)';
    return 'var(--danger)';
  });

  attendanceOffset = computed(() => {
    const a = this.member()?.attendance ?? 0;
    return this.circumference * (1 - a / 100);
  });

  confirmTitle = computed(() => {
    const m = this.member();
    return m ? `${m.firstName} ${m.lastName} entfernen?` : 'Mitglied entfernen?';
  });

  dues = computed<DueEntry[]>(() => {
    const m = this.member();
    if (!m) return [];
    const y = new Date().getFullYear();
    return [
      { date: `15.01.${y}`,     label: `Jahresbeitrag ${y}`,     amount: 250, paid: m.paid },
      { date: `12.01.${y - 1}`, label: `Jahresbeitrag ${y - 1}`, amount: 250, paid: true },
      { date: `08.01.${y - 2}`, label: `Jahresbeitrag ${y - 2}`, amount: 230, paid: true },
      { date: `10.01.${y - 3}`, label: `Jahresbeitrag ${y - 3}`, amount: 230, paid: true },
    ];
  });

  activity = computed<ActivityEntry[]>(() => {
    const m = this.member();
    if (!m) return [];
    const name = `${m.firstName} ${m.lastName.charAt(0)}.`;
    return [
      { icon: '✓', color: '#059669', text: `${name} hat sich für Training (Mi 19:30) angemeldet`, time: 'vor 2 Std' },
      { icon: '💰', color: '#2563EB', text: 'Jahresbeitrag bezahlt: CHF 250.00', time: 'vor 3 Tagen' },
      { icon: '👤', color: '#059669', text: `Profilbild aktualisiert`, time: 'vor 1 Woche' },
      { icon: '✕', color: '#D97706', text: `${name} hat sich vom Match (Sa 15:00) abgemeldet`, time: 'vor 2 Wochen' },
      { icon: '📅', color: '#2563EB', text: 'Teilnahme bestätigt für Grümpelturnier', time: 'vor 3 Wochen' },
    ];
  });

  // --- Actions ---
  close(): void {
    this.state.closeMember();
    this.tab.set('profil');
  }

  edit(): void {
    this.toast.show({ body: 'Bearbeiten-Dialog (Demo).' });
  }

  doDelete(): void {
    const m = this.member();
    if (!m) return;
    this.toast.show({ kind: 'success', body: `${m.firstName} ${m.lastName} entfernt.` });
    this.close();
  }
}
