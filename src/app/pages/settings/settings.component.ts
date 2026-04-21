import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../core/services/app-state.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

type SettingsSection = 'profile' | 'branding' | 'members' | 'notifications' | 'danger';

interface ClubProfile {
  name: string;
  address: string;
  zip: string;
  city: string;
  phone: string;
  email: string;
  web: string;
  language: 'DE' | 'FR' | 'IT';
}

interface Branding {
  color: string;
  logo: string;
}

interface MemberDefaults {
  feeAmount: number;
  dueDate: string;
  sendReminders: boolean;
}

interface Notifications {
  reminders: { '0h': boolean; '1h': boolean; '3h': boolean; '1d': boolean };
  emails: Array<{ key: string; label: string; on: boolean }>;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, IconComponent, ConfirmDialogComponent],
  template: `
    <div style="padding:24px;display:flex;flex-direction:column;gap:16px;height:calc(100vh - var(--topbar-h))">
      <!-- Page header -->
      <div>
        <h1 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em">Einstellungen</h1>
        <div style="font-size:13px;color:var(--text-muted);margin-top:3px">{{ app.club().name }} verwalten</div>
      </div>

      <div style="display:grid;grid-template-columns:200px 1fr;gap:20px;flex:1;min-height:0">
        <!-- Left nav -->
        <nav style="display:flex;flex-direction:column;gap:2px">
          @for (s of sections; track s.k) {
            <button
              (click)="section.set(s.k)"
              [style.background]="section() === s.k ? 'var(--bg-subtle)' : 'transparent'"
              [style.color]="s.k === 'danger' ? 'var(--danger)' : section() === s.k ? 'var(--text)' : 'var(--text-secondary)'"
              [style.font-weight]="section() === s.k ? 600 : 500"
              style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:6px;text-align:left;font-size:13px;border:none;cursor:pointer"
            >
              <app-icon [name]="s.icon" [size]="14" /> {{ s.l }}
            </button>
          }
        </nav>

        <!-- Right content -->
        <div style="overflow-y:auto">
          @switch (section()) {
            @case ('profile') {
              <div class="card" style="margin-bottom:14px">
                <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
                  <div style="font-size:14px;font-weight:600">Vereinsprofil</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Grundlegende Informationen zu deinem Verein</div>
                </div>
                <div style="padding:20px;display:flex;flex-direction:column;gap:14px">
                  <!-- Logo upload -->
                  <div style="display:flex;align-items:center;gap:14px">
                    <div [style.background]="branding().color"
                      style="width:72px;height:72px;border-radius:12px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px">
                      {{ app.club().logo }}
                    </div>
                    <div style="flex:1">
                      <button class="btn" (click)="uploadLogo()">
                        <app-icon name="upload" [size]="13" /> Logo hochladen
                      </button>
                      <div style="font-size:11px;color:var(--text-muted);margin-top:6px">PNG oder SVG, mind. 256&times;256 px</div>
                    </div>
                  </div>

                  <div><label class="label">Vereinsname</label><input class="input" [(ngModel)]="profile().name" name="name" (ngModelChange)="updateProfile('name', $event)" /></div>
                  <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px">
                    <div><label class="label">Adresse</label><input class="input" [(ngModel)]="profile().address" name="address" (ngModelChange)="updateProfile('address', $event)" /></div>
                    <div><label class="label">PLZ</label><input class="input" [(ngModel)]="profile().zip" name="zip" (ngModelChange)="updateProfile('zip', $event)" /></div>
                  </div>
                  <div><label class="label">Ort</label><input class="input" [(ngModel)]="profile().city" name="city" (ngModelChange)="updateProfile('city', $event)" /></div>

                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <div><label class="label">Telefon</label><input class="input" [(ngModel)]="profile().phone" name="phone" (ngModelChange)="updateProfile('phone', $event)" /></div>
                    <div><label class="label">E-Mail</label><input class="input" type="email" [(ngModel)]="profile().email" name="email" (ngModelChange)="updateProfile('email', $event)" /></div>
                  </div>
                  <div><label class="label">Webseite</label><input class="input" [(ngModel)]="profile().web" name="web" (ngModelChange)="updateProfile('web', $event)" /></div>

                  <div>
                    <label class="label">Sprache</label>
                    <select class="select" [(ngModel)]="profile().language" name="language" (ngModelChange)="updateProfile('language', $event)">
                      <option value="DE">Deutsch</option>
                      <option value="FR">Français</option>
                      <option value="IT">Italiano</option>
                    </select>
                  </div>
                </div>
                <div style="padding:12px 20px;border-top:1px solid var(--border);background:var(--bg-subtle);display:flex;justify-content:flex-end;gap:8px;border-radius:0 0 var(--r-lg) var(--r-lg)">
                  <button class="btn btn-primary" (click)="saveProfile()">Speichern</button>
                </div>
              </div>
            }

            @case ('branding') {
              <!-- Primärfarbe -->
              <div class="card" style="margin-bottom:14px">
                <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
                  <div style="font-size:14px;font-weight:600">Primärfarbe</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Wird für Buttons, Akzente und Highlights verwendet</div>
                </div>
                <div style="padding:20px">
                  <div style="display:flex;flex-wrap:wrap;gap:10px">
                    @for (c of presetColors; track c) {
                      <button
                        (click)="pickColor(c)"
                        [style.background]="c"
                        [style.border]="branding().color === c ? '2px solid var(--text)' : '2px solid transparent'"
                        style="width:44px;height:44px;border-radius:10px;box-shadow:0 0 0 1px var(--border);cursor:pointer"
                        [attr.aria-label]="'Farbe ' + c"
                      ></button>
                    }
                  </div>
                  <div style="margin-top:14px;display:flex;align-items:center;gap:10px">
                    <div [style.background]="branding().color"
                      style="width:40px;height:40px;border-radius:8px;border:1px solid var(--border)"></div>
                    <input class="input" [(ngModel)]="branding().color" name="color"
                      (ngModelChange)="updateBranding('color', $event)"
                      style="max-width:160px;font-family:monospace" />
                  </div>
                </div>
              </div>

              <!-- Logo upload -->
              <div class="card" style="margin-bottom:14px">
                <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
                  <div style="font-size:14px;font-weight:600">Logo</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Erscheint in der Sidebar und in E-Mails</div>
                </div>
                <div style="padding:20px;display:flex;align-items:center;gap:14px">
                  <div [style.background]="branding().color"
                    style="width:72px;height:72px;border-radius:12px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px">
                    {{ app.club().logo }}
                  </div>
                  <div style="flex:1">
                    <button class="btn" (click)="uploadLogo()">
                      <app-icon name="upload" [size]="13" /> Logo hochladen
                    </button>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:6px">PNG oder SVG, mind. 256&times;256 px</div>
                  </div>
                </div>
              </div>

              <!-- Preview -->
              <div class="card">
                <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
                  <div style="font-size:14px;font-weight:600">Vorschau</div>
                </div>
                <div style="padding:20px;display:flex;align-items:center;gap:14px;background:var(--bg-subtle)">
                  <div [style.background]="branding().color"
                    style="width:48px;height:48px;border-radius:10px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700">
                    {{ app.club().logo }}
                  </div>
                  <div style="flex:1">
                    <div style="font-size:15px;font-weight:600">{{ app.club().name }}</div>
                    <div style="font-size:12px;color:var(--text-muted)">So sieht dein Branding aus</div>
                  </div>
                  <button class="btn" [style.background]="branding().color" [style.color]="'#fff'" [style.border]="'none'">Beispiel-Button</button>
                </div>
              </div>
            }

            @case ('members') {
              <div class="card" style="margin-bottom:14px">
                <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
                  <div style="font-size:14px;font-weight:600">Mitglieder-Standards</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Werden bei neuen Mitgliedern als Voreinstellung verwendet</div>
                </div>
                <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:14px">
                  <div>
                    <label class="label">Standard-Beitragshöhe</label>
                    <div style="position:relative">
                      <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--text-muted)">CHF</span>
                      <input type="number" class="input" [(ngModel)]="memberDefaults().feeAmount" name="fee"
                        (ngModelChange)="updateMemberDefaults('feeAmount', $event)"
                        style="padding-left:42px" />
                    </div>
                  </div>
                  <div>
                    <label class="label">Fälligkeitsdatum</label>
                    <input type="date" class="input" [(ngModel)]="memberDefaults().dueDate" name="due"
                      (ngModelChange)="updateMemberDefaults('dueDate', $event)" />
                  </div>
                  <div style="grid-column:span 2">
                    <label style="display:inline-flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
                      <input type="checkbox" [checked]="memberDefaults().sendReminders"
                        (change)="updateMemberDefaults('sendReminders', $any($event.target).checked)" />
                      Standard-Zahlungserinnerungen aktivieren
                    </label>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:4px;margin-left:24px">Mitglieder erhalten automatische Erinnerungen vor Fälligkeit.</div>
                  </div>
                </div>
                <div style="padding:12px 20px;border-top:1px solid var(--border);background:var(--bg-subtle);display:flex;justify-content:flex-end;gap:8px;border-radius:0 0 var(--r-lg) var(--r-lg)">
                  <button class="btn btn-primary" (click)="saveMembers()">Speichern</button>
                </div>
              </div>
            }

            @case ('notifications') {
              <div class="card" style="margin-bottom:14px">
                <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
                  <div style="font-size:14px;font-weight:600">Push-Reminder-Defaults</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Automatische Erinnerungen für Events</div>
                </div>
                <div style="padding:20px;display:flex;flex-direction:column;gap:10px">
                  @for (rem of reminderOptions; track rem.key) {
                    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-subtle);border-radius:6px;cursor:pointer">
                      <input type="checkbox"
                        [checked]="notifications().reminders[rem.key]"
                        (change)="toggleReminder(rem.key, $any($event.target).checked)" />
                      <div style="flex:1">
                        <div style="font-size:13px;font-weight:500">{{ rem.label }}</div>
                        <div style="font-size:11px;color:var(--text-muted)">{{ rem.sub }}</div>
                      </div>
                    </label>
                  }
                </div>
              </div>

              <div class="card">
                <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
                  <div style="font-size:14px;font-weight:600">E-Mail-Benachrichtigungen</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Welche E-Mails sollen versendet werden</div>
                </div>
                <div style="padding:8px">
                  @for (e of notifications().emails; track e.key) {
                    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--border)">
                      <div style="flex:1">
                        <div style="font-size:13px;font-weight:500">{{ e.label }}</div>
                      </div>
                      <button
                        (click)="toggleEmail(e.key)"
                        [style.background]="e.on ? 'var(--primary)' : 'var(--border-strong)'"
                        style="width:36px;height:20px;border-radius:10px;position:relative;border:none;cursor:pointer;transition:background .15s"
                      >
                        <div
                          [style.left.px]="e.on ? 18 : 2"
                          style="position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 2px rgba(0,0,0,0.2)"
                        ></div>
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            @case ('danger') {
              <div class="card" style="border-color:var(--danger);margin-bottom:14px">
                <div style="padding:20px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
                  <div>
                    <div style="font-size:14px;font-weight:600">Verein archivieren</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:3px;max-width:500px">Archivierte Vereine sind schreibgeschützt. Daten bleiben erhalten, aber keine neuen Aktivitäten mehr möglich.</div>
                  </div>
                  <button class="btn" style="color:var(--warning);border-color:var(--warning)" (click)="confirm.set('archive')">
                    <app-icon name="archive" [size]="13" /> Archivieren
                  </button>
                </div>
                <div style="padding:20px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
                  <div>
                    <div style="font-size:14px;font-weight:600;color:var(--danger)">Verein löschen</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:3px;max-width:500px">Dieser Vorgang ist unwiderruflich. Alle Daten, Mitglieder, Events und News werden endgültig gelöscht.</div>
                  </div>
                  <button class="btn btn-danger" (click)="confirm.set('delete')">
                    <app-icon name="trash" [size]="13" /> Löschen
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>

    <app-confirm-dialog
      [open]="confirm() === 'archive'"
      title="Verein archivieren?"
      body="Der Verein wird schreibgeschützt. Du kannst ihn später wieder aktivieren."
      confirmLabel="Archivieren"
      (closed)="confirm.set(null)"
      (confirmed)="onArchive()"
    />
    <app-confirm-dialog
      [open]="confirm() === 'delete'"
      title="Verein unwiderruflich löschen?"
      body="Alle Mitglieder, Events, News und Beiträge gehen verloren. Dieser Vorgang kann nicht rückgängig gemacht werden."
      confirmLabel="Endgültig löschen"
      [danger]="true"
      (closed)="confirm.set(null)"
      (confirmed)="onDelete()"
    />
  `,
})
export class SettingsComponent {
  app = inject(AppStateService);
  private toast = inject(ToastService);

  readonly sections: Array<{ k: SettingsSection; l: string; icon: string }> = [
    { k: 'profile', l: 'Vereinsprofil', icon: 'building' },
    { k: 'branding', l: 'Branding', icon: 'image' },
    { k: 'members', l: 'Mitglieder', icon: 'users' },
    { k: 'notifications', l: 'Benachrichtigungen', icon: 'bell' },
    { k: 'danger', l: 'Gefahrenzone', icon: 'alert' },
  ];

  readonly presetColors = ['#DC2626', '#EA580C', '#F59E0B', '#059669', '#2563EB', '#7C3AED', '#DB2777', '#0F172A'];

  readonly reminderOptions: Array<{ key: '0h' | '1h' | '3h' | '1d'; label: string; sub: string }> = [
    { key: '0h', label: 'Zum Eventstart', sub: 'Benachrichtigung genau zum Beginn' },
    { key: '1h', label: '1 Stunde vorher', sub: 'Kurzfristige Erinnerung' },
    { key: '3h', label: '3 Stunden vorher', sub: 'Standard für Trainings' },
    { key: '1d', label: '1 Tag vorher', sub: 'Standard für Matches und Events' },
  ];

  section = signal<SettingsSection>('profile');
  confirm = signal<'archive' | 'delete' | null>(null);

  profile = signal<ClubProfile>({
    name: this.app.club().name,
    address: 'Rüttigasse 12',
    zip: '6462',
    city: 'Seedorf UR',
    phone: '+41 41 870 12 34',
    email: 'info@fc-seedorf.ch',
    web: 'https://fc-seedorf.ch',
    language: 'DE',
  });

  branding = signal<Branding>({
    color: this.app.club().color || '#DC2626',
    logo: this.app.club().logo,
  });

  memberDefaults = signal<MemberDefaults>({
    feeAmount: 250,
    dueDate: '2026-03-31',
    sendReminders: true,
  });

  notifications = signal<Notifications>({
    reminders: { '0h': false, '1h': false, '3h': true, '1d': true },
    emails: [
      { key: 'events', label: 'Event-Einladungen', on: true },
      { key: 'news', label: 'Neue News-Beiträge', on: true },
      { key: 'dues', label: 'Beitragserinnerungen', on: true },
      { key: 'members', label: 'Neue Mitglieder', on: false },
      { key: 'weekly', label: 'Wöchentliche Zusammenfassung', on: false },
    ],
  });

  updateProfile<K extends keyof ClubProfile>(key: K, value: ClubProfile[K]): void {
    this.profile.update(p => ({ ...p, [key]: value }));
  }

  updateBranding<K extends keyof Branding>(key: K, value: Branding[K]): void {
    this.branding.update(b => ({ ...b, [key]: value }));
  }

  updateMemberDefaults<K extends keyof MemberDefaults>(key: K, value: MemberDefaults[K]): void {
    this.memberDefaults.update(m => ({ ...m, [key]: value }));
  }

  pickColor(c: string): void {
    this.branding.update(b => ({ ...b, color: c }));
  }

  toggleReminder(key: '0h' | '1h' | '3h' | '1d', value: boolean): void {
    this.notifications.update(n => ({ ...n, reminders: { ...n.reminders, [key]: value } }));
  }

  toggleEmail(key: string): void {
    this.notifications.update(n => ({
      ...n,
      emails: n.emails.map(e => e.key === key ? { ...e, on: !e.on } : e),
    }));
  }

  uploadLogo(): void {
    this.toast.show({ body: 'Logo-Upload geöffnet' });
  }

  saveProfile(): void {
    this.app.club.update(c => ({ ...c, name: this.profile().name }));
    this.toast.show({ kind: 'success', body: 'Vereinsprofil gespeichert' });
  }

  saveMembers(): void {
    this.toast.show({ kind: 'success', body: 'Mitglieder-Standards gespeichert' });
  }

  onArchive(): void {
    this.toast.show({ kind: 'warning', body: 'Verein archiviert' });
  }

  onDelete(): void {
    this.toast.show({ kind: 'error', body: 'Verein gelöscht' });
  }
}
