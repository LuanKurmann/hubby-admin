import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService } from '../../core/services/app-state.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

type ProfileTab = 'overview' | 'personal' | 'security' | 'sessions' | 'activity';

interface PersonalForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  language: string;
  address: string;
  zip: string;
  city: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  current?: boolean;
  icon: 'laptop' | 'smartphone' | 'tablet' | 'monitor';
}

interface ActivityEntry {
  icon: string;
  text: string;
  meta: string;
  time: string;
}

interface TeamRole {
  teamName: string;
  short: string;
  color: string;
  role: string;
  since: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, IconComponent, AvatarComponent, ModalComponent, ConfirmDialogComponent],
  template: `
    <div style="padding:24px;display:flex;flex-direction:column;gap:20px">
      <!-- Hero card -->
      <div class="card" style="overflow:hidden">
        <div style="height:120px;background:linear-gradient(135deg, var(--primary) 0%, oklch(from var(--primary) calc(l - 0.15) c h) 100%);position:relative">
          <svg style="position:absolute;inset:0;opacity:0.18;width:100%;height:100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="profpat" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="1" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#profpat)"/>
          </svg>
        </div>
        <div style="padding:0 24px 20px;display:flex;align-items:flex-end;gap:18px;margin-top:-36px">
          <div style="border:4px solid var(--bg-elev);border-radius:50%;box-shadow:var(--shadow-sm)">
            <app-avatar [name]="app.user().name" size="xl" />
          </div>
          <div style="flex:1;padding-bottom:6px;min-width:0">
            <div style="font-size:22px;font-weight:600;letter-spacing:-0.02em">{{ app.user().name }}</div>
            <div style="display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text-muted);margin-top:4px;flex-wrap:wrap">
              <span style="display:inline-flex;align-items:center;gap:4px"><app-icon name="mail" [size]="12" /> {{ app.user().email }}</span>
              <span>&middot;</span>
              <span style="display:inline-flex;align-items:center;gap:4px"><app-icon name="shield" [size]="12" /> {{ app.club().role }}</span>
              <span>&middot;</span>
              <span style="display:inline-flex;align-items:center;gap:4px"><app-icon name="calendar" [size]="12" /> Mitglied seit 15.08.2022</span>
            </div>
          </div>
          <div style="padding-bottom:6px;display:flex;gap:6px;flex-shrink:0">
            <button class="btn" (click)="changePhoto()"><app-icon name="camera" [size]="13" /> Foto ändern</button>
            <button class="btn btn-primary" (click)="tab.set('personal')"><app-icon name="edit" [size]="13" /> Bearbeiten</button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:4px;border-bottom:1px solid var(--border)">
        @for (t of tabs; track t.k) {
          <button
            (click)="tab.set(t.k)"
            [style.color]="tab() === t.k ? 'var(--text)' : 'var(--text-muted)'"
            [style.border-bottom]="'2px solid ' + (tab() === t.k ? 'var(--primary)' : 'transparent')"
            style="padding:8px 14px;font-size:13px;font-weight:500;margin-bottom:-1px;background:none;border-top:none;border-left:none;border-right:none;cursor:pointer"
          >{{ t.l }}</button>
        }
      </div>

      <!-- Tab content -->
      @switch (tab()) {
        @case ('overview') {
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px">
            <!-- Left col -->
            <div style="display:flex;flex-direction:column;gap:16px">
              <!-- Meine Aktivität -->
              <div class="card" style="padding:20px">
                <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:12px">Meine Aktivität</div>
                <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:10px">
                  @for (s of stats; track s.label) {
                    <div style="padding:12px 14px;background:var(--bg-subtle);border-radius:8px">
                      <div style="font-size:11px;color:var(--text-muted)">{{ s.label }}</div>
                      <div [style.color]="s.color" style="font-size:24px;font-weight:600;letter-spacing:-0.02em;margin-top:2px">{{ s.value }}</div>
                    </div>
                  }
                </div>
              </div>

              <!-- Meine Teams & Rollen -->
              <div class="card">
                <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                  <div style="font-size:13px;font-weight:600">Meine Teams &amp; Rollen</div>
                  <button class="btn btn-ghost btn-sm" (click)="router.navigate(['/teams'])">
                    Alle Teams <app-icon name="chevronRight" [size]="12" />
                  </button>
                </div>
                <div style="padding:8px">
                  @for (tr of teamRoles; track tr.teamName) {
                    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:6px">
                      <div [style.background]="tr.color"
                        style="width:36px;height:36px;border-radius:8px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">
                        {{ tr.short }}
                      </div>
                      <div style="flex:1">
                        <div style="font-size:13px;font-weight:500">{{ tr.teamName }}</div>
                        <div style="font-size:11px;color:var(--text-muted)">{{ tr.role }} &middot; seit {{ tr.since }}</div>
                      </div>
                      <span class="chip">{{ tr.role }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Right col -->
            <div style="display:flex;flex-direction:column;gap:16px">
              <!-- Account-Sicherheit -->
              <div class="card" style="padding:18px">
                <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:12px">Account-Sicherheit</div>
                @for (row of securityRows(); track row.label; let last = $last) {
                  <div [style.border-bottom]="last ? 'none' : '1px solid var(--border)'"
                    style="display:flex;align-items:center;gap:10px;padding:8px 0">
                    <app-icon [name]="row.icon" [size]="14" />
                    <div style="flex:1">
                      <div style="font-size:13px;font-weight:500">{{ row.label }}</div>
                      <div style="font-size:11px;color:var(--text-muted)">{{ row.value }}</div>
                    </div>
                    <div [style.background]="statusColor(row.status)"
                      style="width:8px;height:8px;border-radius:50%"></div>
                  </div>
                }
              </div>

              <!-- Schnellzugriff -->
              <div class="card" style="padding:18px">
                <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:12px">Schnellzugriff</div>
                <div style="display:flex;flex-direction:column;gap:6px">
                  <button class="btn" style="justify-content:flex-start" (click)="exportData()">
                    <app-icon name="download" [size]="13" /> Meine Daten exportieren
                  </button>
                  <button class="btn" style="justify-content:flex-start" (click)="router.navigate(['/settings'])">
                    <app-icon name="settings" [size]="13" /> Vereinseinstellungen
                  </button>
                  <button class="btn" style="justify-content:flex-start" (click)="openHelp()">
                    <app-icon name="help" [size]="13" /> Hilfe &amp; Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

        @case ('personal') {
          <div style="display:grid;grid-template-columns:1fr;gap:16px;max-width:780px">
            <div class="card">
              <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
                <div style="font-size:14px;font-weight:600">Persönliche Angaben</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Sichtbar für Admins deines Vereins</div>
              </div>
              <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div><label class="label">Vorname</label><input class="input" [(ngModel)]="form().firstName" name="firstName" (ngModelChange)="updateForm('firstName', $event)" /></div>
                <div><label class="label">Nachname</label><input class="input" [(ngModel)]="form().lastName" name="lastName" (ngModelChange)="updateForm('lastName', $event)" /></div>
                <div><label class="label">E-Mail</label><input class="input" type="email" [(ngModel)]="form().email" name="email" (ngModelChange)="updateForm('email', $event)" /></div>
                <div><label class="label">Telefon</label><input class="input" [(ngModel)]="form().phone" name="phone" (ngModelChange)="updateForm('phone', $event)" /></div>
                <div><label class="label">Geburtsdatum</label><input class="input" [(ngModel)]="form().birthDate" name="birthDate" (ngModelChange)="updateForm('birthDate', $event)" /></div>
                <div>
                  <label class="label">Sprache</label>
                  <select class="select" [(ngModel)]="form().language" name="language" (ngModelChange)="updateForm('language', $event)">
                    <option>Deutsch</option>
                    <option>Français</option>
                    <option>Italiano</option>
                    <option>English</option>
                  </select>
                </div>
              </div>
              <div style="padding:0 20px 20px;display:grid;grid-template-columns:2fr 1fr 2fr;gap:12px">
                <div><label class="label">Adresse</label><input class="input" [(ngModel)]="form().address" name="address" (ngModelChange)="updateForm('address', $event)" /></div>
                <div><label class="label">PLZ</label><input class="input" [(ngModel)]="form().zip" name="zip" (ngModelChange)="updateForm('zip', $event)" /></div>
                <div><label class="label">Ort</label><input class="input" [(ngModel)]="form().city" name="city" (ngModelChange)="updateForm('city', $event)" /></div>
              </div>
              <div style="padding:12px 20px;border-top:1px solid var(--border);background:var(--bg-subtle);display:flex;justify-content:flex-end;gap:8px;border-radius:0 0 var(--r-lg) var(--r-lg)">
                <button class="btn" (click)="resetForm()">Zurücksetzen</button>
                <button class="btn btn-primary" (click)="savePersonal()">Speichern</button>
              </div>
            </div>
          </div>
        }

        @case ('security') {
          <div style="display:flex;flex-direction:column;gap:16px;max-width:780px">
            <!-- Passwort -->
            <div class="card">
              <div style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px">
                <div>
                  <div style="font-size:14px;font-weight:600">Passwort</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Zuletzt geändert vor 42 Tagen</div>
                </div>
                <button class="btn" (click)="pwOpen.set(true)">
                  <app-icon name="key" [size]="13" /> Passwort ändern
                </button>
              </div>
            </div>

            <!-- 2FA -->
            <div class="card">
              <div style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px">
                <div>
                  <div style="font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px">
                    Zwei-Faktor-Authentifizierung
                    @if (twoFaOn()) {
                      <span class="badge badge-success">Aktiv</span>
                    } @else {
                      <span class="badge badge-warning">Empfohlen</span>
                    }
                  </div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:3px;max-width:460px">Zusätzliche Sicherheit durch einen Code aus deiner Authenticator-App beim Login.</div>
                </div>
                <button [class]="twoFaOn() ? 'btn' : 'btn btn-primary'" (click)="toggle2Fa()">
                  {{ twoFaOn() ? 'Deaktivieren' : 'Aktivieren' }}
                </button>
              </div>
            </div>

            <!-- Danger zone -->
            <div class="card" style="border-color:var(--danger)">
              <div style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px">
                <div>
                  <div style="font-size:14px;font-weight:600;color:var(--danger)">Account löschen</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:3px;max-width:500px">Dein persönlicher Account wird gelöscht. Vereinsdaten bleiben anonymisiert erhalten.</div>
                </div>
                <button class="btn btn-danger" (click)="confirmDelete.set(true)">
                  <app-icon name="trash" [size]="13" /> Account löschen
                </button>
              </div>
            </div>
          </div>
        }

        @case ('sessions') {
          <div style="display:flex;flex-direction:column;gap:10px;max-width:780px">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="font-size:13px;color:var(--text-muted)">{{ sessions().length }} aktive Sessions</div>
              <button class="btn btn-sm" (click)="revokeAllOthers()" [disabled]="!hasOtherSessions()">
                Alle anderen beenden
              </button>
            </div>
            @for (s of sessions(); track s.id) {
              <div class="card" style="padding:14px;display:flex;align-items:center;gap:14px">
                <div style="width:40px;height:40px;border-radius:10px;background:var(--bg-subtle);color:var(--text-muted);display:flex;align-items:center;justify-content:center">
                  <app-icon [name]="s.icon" [size]="18" />
                </div>
                <div style="flex:1">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="font-size:13px;font-weight:600">{{ s.device }}</div>
                    @if (s.current) {
                      <span class="badge badge-success">Aktuell</span>
                    }
                  </div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">{{ s.browser }} &middot; {{ s.location }} &middot; {{ s.ip }}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">{{ s.lastActive }}</div>
                </div>
                @if (!s.current) {
                  <button class="btn btn-sm" style="color:var(--danger)" (click)="revokeSession(s.id)">
                    <app-icon name="logout" [size]="12" /> Beenden
                  </button>
                }
              </div>
            }
          </div>
        }

        @case ('activity') {
          <div class="card" style="max-width:780px">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border)">
              <div style="font-size:13px;font-weight:600">Aktivitätsverlauf</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:3px">Deine letzten Aktionen in Hubby</div>
            </div>
            <div style="padding:4px">
              @for (l of activityLog; track $index; let last = $last) {
                <div [style.border-bottom]="last ? 'none' : '1px solid var(--border)'"
                  style="display:flex;align-items:center;gap:12px;padding:10px 14px">
                  <div style="width:28px;height:28px;border-radius:50%;background:var(--bg-subtle);color:var(--text-muted);display:flex;align-items:center;justify-content:center">
                    <app-icon [name]="l.icon" [size]="13" />
                  </div>
                  <div style="flex:1">
                    <div style="font-size:13px">{{ l.text }}</div>
                    <div style="font-size:11px;color:var(--text-muted)">{{ l.meta }}</div>
                  </div>
                  <div style="font-size:11px;color:var(--text-muted)">{{ l.time }}</div>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>

    <!-- Password change modal -->
    <app-modal [open]="pwOpen()" title="Passwort ändern" [width]="440" (closed)="pwOpen.set(false)">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div><label class="label">Aktuelles Passwort</label><input class="input" type="password" [(ngModel)]="pwCurrent" name="pwCurrent" autofocus /></div>
        <div><label class="label">Neues Passwort</label><input class="input" type="password" [(ngModel)]="pwNew" name="pwNew" /></div>
        <div><label class="label">Neues Passwort bestätigen</label><input class="input" type="password" [(ngModel)]="pwConfirm" name="pwConfirm" /></div>
        <div style="padding:10px;background:var(--bg-subtle);border-radius:6px;font-size:11px;color:var(--text-muted);line-height:1.5">
          <div style="font-weight:600;color:var(--text-secondary);margin-bottom:4px">Mindestanforderungen</div>
          &bull; Mindestens 8 Zeichen<br/>
          &bull; Ein Grossbuchstabe<br/>
          &bull; Eine Zahl oder ein Sonderzeichen
        </div>
      </div>
      <ng-container ngProjectAs="[slot=footer]">
        <button class="btn" (click)="pwOpen.set(false)">Abbrechen</button>
        <button class="btn btn-primary" (click)="savePassword()">Speichern</button>
      </ng-container>
    </app-modal>

    <!-- Delete account confirm dialog -->
    <app-confirm-dialog
      [open]="confirmDelete()"
      title="Account unwiderruflich löschen?"
      body="Dein Benutzerkonto wird gelöscht. Alle Daten, Rollen und Mitgliedschaften bleiben im Verein erhalten (anonymisiert)."
      confirmLabel="Endgültig löschen"
      [danger]="true"
      (closed)="confirmDelete.set(false)"
      (confirmed)="onDeleteAccount()"
    />
  `,
})
export class ProfileComponent {
  app = inject(AppStateService);
  router = inject(Router);
  private mock = inject(MockDataService);
  private toast = inject(ToastService);

  readonly tabs: Array<{ k: ProfileTab; l: string }> = [
    { k: 'overview', l: 'Übersicht' },
    { k: 'personal', l: 'Persönliche Daten' },
    { k: 'security', l: 'Sicherheit' },
    { k: 'sessions', l: 'Geräte & Sessions' },
    { k: 'activity', l: 'Aktivität' },
  ];

  readonly stats = [
    { label: 'Events organisiert', value: 47, color: 'var(--primary)' },
    { label: 'News publiziert', value: 23, color: 'var(--info)' },
    { label: 'Mitglieder eingeladen', value: 18, color: 'var(--success)' },
    { label: 'Aktive Tage', value: 312, color: 'var(--warning)' },
  ];

  readonly teamRoles: TeamRole[] = [
    { teamName: this.mock.teams[0].name, short: this.mock.teams[0].short, color: this.mock.teams[0].color, role: 'Präsident', since: '2022' },
    { teamName: this.mock.teams[1].name, short: this.mock.teams[1].short, color: this.mock.teams[1].color, role: 'Trainer', since: '2023' },
  ];

  readonly activityLog: ActivityEntry[] = [
    { icon: 'login', text: 'Angemeldet', meta: 'Chrome · MacBook Pro', time: 'Jetzt' },
    { icon: 'plus', text: 'Event "Training 1. Mannschaft" erstellt', meta: 'Trainings & Matches', time: 'vor 2 Std' },
    { icon: 'userPlus', text: 'Dario Rossi eingeladen', meta: 'Mitglieder', time: 'vor 4 Std' },
    { icon: 'news', text: 'News "Cup-Sieg!" publiziert', meta: 'News', time: 'gestern' },
    { icon: 'check', text: '5 Beiträge als bezahlt markiert', meta: 'Beiträge', time: 'gestern' },
    { icon: 'edit', text: 'Teamprofil "1. Mannschaft" bearbeitet', meta: 'Teams', time: 'vor 2 Tagen' },
    { icon: 'key', text: 'Passwort geändert', meta: 'Sicherheit', time: 'vor 42 Tagen' },
  ];

  tab = signal<ProfileTab>('overview');
  twoFaOn = signal<boolean>(false);
  pwOpen = signal<boolean>(false);
  confirmDelete = signal<boolean>(false);

  pwCurrent = '';
  pwNew = '';
  pwConfirm = '';

  form = signal<PersonalForm>(this.makeInitialForm());

  sessions = signal<Session[]>([
    { id: 's1', device: 'MacBook Pro', browser: 'Chrome 128', location: 'Seedorf, Schweiz', ip: '85.7.x.x', lastActive: 'Jetzt aktiv', current: true, icon: 'laptop' },
    { id: 's2', device: 'iPhone 15', browser: 'Hubby App', location: 'Altdorf, Schweiz', ip: '85.7.x.x', lastActive: 'vor 3 Std', icon: 'smartphone' },
    { id: 's3', device: 'iPad Air', browser: 'Safari', location: 'Luzern, Schweiz', ip: '91.4.x.x', lastActive: 'gestern', icon: 'tablet' },
    { id: 's4', device: 'Windows PC', browser: 'Firefox 130', location: 'Zürich, Schweiz', ip: '178.2.x.x', lastActive: 'vor 5 Tagen', icon: 'monitor' },
  ]);

  hasOtherSessions = computed(() => this.sessions().some(s => !s.current));

  securityRows = computed(() => [
    { icon: 'key', label: 'Passwort', value: 'Vor 42 Tagen geändert', status: 'ok' as const },
    { icon: 'shield', label: 'Zwei-Faktor-Auth', value: this.twoFaOn() ? 'Aktiv' : 'Nicht aktiviert', status: this.twoFaOn() ? 'ok' as const : 'warn' as const },
    { icon: 'mail', label: 'E-Mail verifiziert', value: 'Bestätigt', status: 'ok' as const },
  ]);

  statusColor(status: 'ok' | 'warn' | 'danger'): string {
    return status === 'ok' ? 'var(--success)' : status === 'warn' ? 'var(--warning)' : 'var(--danger)';
  }

  private makeInitialForm(): PersonalForm {
    const name = this.app.user().name;
    const parts = name.split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' '),
      email: this.app.user().email,
      phone: '+41 79 123 45 67',
      birthDate: '12.04.1985',
      address: 'Dorfstrasse 8',
      zip: '6462',
      city: 'Seedorf UR',
      language: 'Deutsch',
    };
  }

  updateForm<K extends keyof PersonalForm>(key: K, value: PersonalForm[K]): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  resetForm(): void {
    this.form.set(this.makeInitialForm());
    this.toast.show({ body: 'Änderungen zurückgesetzt' });
  }

  savePersonal(): void {
    const f = this.form();
    this.app.user.set({ name: `${f.firstName} ${f.lastName}`.trim(), email: f.email });
    this.toast.show({ kind: 'success', body: 'Profil gespeichert' });
  }

  changePhoto(): void {
    this.toast.show({ body: 'Foto-Upload geöffnet' });
  }

  exportData(): void {
    this.toast.show({ kind: 'success', body: 'Datenexport gestartet' });
  }

  openHelp(): void {
    this.toast.show({ body: 'Support-Zentrum geöffnet' });
  }

  toggle2Fa(): void {
    const next = !this.twoFaOn();
    this.twoFaOn.set(next);
    this.toast.show({ kind: 'success', body: next ? '2FA aktiviert' : '2FA deaktiviert' });
  }

  savePassword(): void {
    if (!this.pwCurrent || !this.pwNew || this.pwNew !== this.pwConfirm) {
      this.toast.show({ kind: 'error', body: 'Passwörter stimmen nicht überein' });
      return;
    }
    this.pwOpen.set(false);
    this.pwCurrent = this.pwNew = this.pwConfirm = '';
    this.toast.show({ kind: 'success', body: 'Passwort aktualisiert' });
  }

  revokeSession(id: string): void {
    this.sessions.update(list => list.filter(s => s.id !== id));
    this.toast.show({ kind: 'success', body: 'Session beendet' });
  }

  revokeAllOthers(): void {
    this.sessions.update(list => list.filter(s => s.current));
    this.toast.show({ kind: 'success', body: 'Alle anderen Sessions beendet' });
  }

  onDeleteAccount(): void {
    this.toast.show({ kind: 'error', body: 'Account gelöscht' });
    this.app.authenticated.set(false);
  }
}
