import { Component, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../core/services/app-state.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { Role } from '../../core/models';

interface PermGroup {
  group: string;
  actions: string[];
}

const PERMS: PermGroup[] = [
  { group: 'Mitglieder', actions: ['sehen', 'erstellen', 'bearbeiten', 'löschen'] },
  { group: 'Teams', actions: ['sehen', 'erstellen', 'bearbeiten', 'löschen'] },
  { group: 'Events', actions: ['sehen', 'erstellen', 'bearbeiten', 'löschen', 'Anwesenheit'] },
  { group: 'News', actions: ['sehen', 'erstellen', 'publizieren', 'löschen'] },
  { group: 'Beiträge', actions: ['sehen', 'als bezahlt markieren'] },
  { group: 'Rollen', actions: ['sehen', 'verwalten'] },
  { group: 'Einstellungen', actions: ['sehen', 'verwalten'] },
];

function defaultPerms(name: string): Record<string, boolean> {
  const p: Record<string, boolean> = {};
  PERMS.forEach(sec => sec.actions.forEach(a => { p[`${sec.group}.${a}`] = false; }));
  const set = (keys: string[]) => keys.forEach(k => { p[k] = true; });
  if (name === 'Präsident') Object.keys(p).forEach(k => p[k] = true);
  if (name === 'Kassier') set(['Mitglieder.sehen','Beiträge.sehen','Beiträge.als bezahlt markieren','Einstellungen.sehen']);
  if (name === 'Aktuar') set(['Mitglieder.sehen','Mitglieder.erstellen','Mitglieder.bearbeiten','News.sehen','News.erstellen','News.publizieren','Events.sehen','Events.erstellen']);
  if (name === 'Trainer') set(['Teams.sehen','Events.sehen','Events.erstellen','Events.bearbeiten','Events.Anwesenheit','News.sehen','News.erstellen','Mitglieder.sehen']);
  if (name === 'Aktivmitglied') set(['Teams.sehen','Events.sehen','News.sehen','Mitglieder.sehen']);
  if (name === 'Passivmitglied') set(['News.sehen','Events.sehen']);
  if (name === 'Materialwart') set(['Events.sehen']);
  return p;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [FormsModule, IconComponent, ConfirmDialogComponent],
  template: `
    <div style="padding:24px;display:flex;flex-direction:column;gap:16px;height:calc(100vh - var(--topbar-h))">
      <!-- Page header -->
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px">
        <div>
          <h1 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em">Rollen &amp; Rechte</h1>
          <div style="font-size:13px;color:var(--text-muted);margin-top:3px">{{ roles().length }} Rollen definiert</div>
        </div>
        <button class="btn btn-primary" (click)="createRole()">
          <app-icon name="plus" [size]="13" /> Rolle erstellen
        </button>
      </div>

      <!-- Grid 2-col -->
      <div style="display:grid;grid-template-columns:300px 1fr;gap:16px;flex:1;min-height:0">
        <!-- Left: list of roles -->
        <div class="card" style="padding:8px;overflow-y:auto">
          @for (r of roles(); track r.id) {
            <button
              (click)="selectRole(r.id)"
              [style.background]="selectedRoleId() === r.id ? 'var(--primary-subtle)' : 'transparent'"
              style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:6px;text-align:left;margin-bottom:2px;border:none;cursor:pointer"
            >
              <div style="width:32px;height:32px;border-radius:8px;background:var(--bg-subtle);color:var(--text-muted);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <app-icon [name]="r.system ? 'shield' : 'user'" [size]="14" />
              </div>
              <div style="flex:1;min-width:0">
                <div [style.color]="selectedRoleId() === r.id ? 'var(--primary)' : 'var(--text)'"
                     style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px">
                  {{ r.name }}
                  @if (r.system) {
                    <span class="chip" style="font-size:9px;padding:0 6px;height:16px;line-height:16px">SYSTEM</span>
                  }
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ r.description }}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">{{ r.users }} Mitglieder</div>
              </div>
            </button>
          }
        </div>

        <!-- Right: role details -->
        @if (selectedRole(); as role) {
          <div class="card" style="display:flex;flex-direction:column;overflow:hidden">
            <!-- Header -->
            <div style="padding:16px 20px;border-bottom:1px solid var(--border)">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
                <div style="min-width:0">
                  <h2 style="margin:0;font-size:18px;font-weight:600;letter-spacing:-0.02em;display:flex;align-items:center;gap:8px">
                    {{ role.name }}
                    @if (role.system) {
                      <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:500;color:var(--text-muted);padding:3px 8px;background:var(--bg-subtle);border-radius:var(--r-full)">
                        <app-icon name="lock" [size]="10" /> System-Rolle &middot; schreibgeschützt
                      </span>
                    }
                  </h2>
                  <div style="font-size:13px;color:var(--text-muted);margin-top:4px">{{ role.description }}</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:6px;display:flex;align-items:center;gap:6px">
                    <app-icon name="users" [size]="12" /> {{ role.users }} Mitglieder mit dieser Rolle
                  </div>
                </div>
                @if (!role.system) {
                  <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="confirmDelete.set(true)">
                    <app-icon name="trash" [size]="12" /> Rolle löschen
                  </button>
                }
              </div>
            </div>

            <!-- Permission matrix -->
            <div style="flex:1;overflow-y:auto;padding:20px">
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:12px">Permission-Matrix</div>
              <div style="display:flex;flex-direction:column;gap:10px">
                @for (sec of groups; track sec.group) {
                  <div class="card" style="padding:0;overflow:hidden">
                    <div style="padding:10px 14px;background:var(--bg-subtle);border-bottom:1px solid var(--border);font-size:13px;font-weight:600">{{ sec.group }}</div>
                    <table style="width:100%;border-collapse:collapse;font-size:13px">
                      <tbody>
                        @for (a of sec.actions; track a) {
                          <tr style="border-top:1px solid var(--border)">
                            <td style="padding:10px 14px;color:var(--text-secondary)">{{ a }}</td>
                            <td style="padding:10px 14px;text-align:right;width:60px">
                              <label style="display:inline-flex;align-items:center;cursor:pointer" [style.cursor]="role.system ? 'not-allowed' : 'pointer'" [style.opacity]="role.system ? 0.7 : 1">
                                <input
                                  type="checkbox"
                                  [checked]="perms()[sec.group + '.' + a]"
                                  [disabled]="role.system"
                                  (change)="togglePerm(sec.group + '.' + a, $any($event.target).checked)"
                                  style="width:16px;height:16px;accent-color:var(--primary)"
                                />
                              </label>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>

            <!-- Footer -->
            <div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:8px;background:var(--bg-subtle)">
              <div style="font-size:12px;color:var(--text-muted)">
                @if (role.system) {
                  <span style="display:inline-flex;align-items:center;gap:6px">
                    <app-icon name="lock" [size]="12" /> System-Rolle kann nicht verändert werden
                  </span>
                } @else {
                  {{ activeCount() }} von {{ totalCount }} Berechtigungen aktiv
                }
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn" (click)="reset()" [disabled]="role.system">Zurücksetzen</button>
                <button class="btn btn-primary" (click)="save()" [disabled]="role.system">Speichern</button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <app-confirm-dialog
      [open]="confirmDelete()"
      title="Rolle löschen?"
      [body]="'Die Rolle &quot;' + (selectedRole()?.name || '') + '&quot; wird gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.'"
      confirmLabel="Löschen"
      [danger]="true"
      (closed)="confirmDelete.set(false)"
      (confirmed)="deleteRole()"
    />
  `,
})
export class RolesComponent {
  private mock = inject(MockDataService);
  private toast = inject(ToastService);
  private app = inject(AppStateService);

  readonly groups = PERMS;
  readonly totalCount = PERMS.reduce((n, s) => n + s.actions.length, 0);

  roles = signal<Role[]>([...this.mock.roles]);
  selectedRoleId = signal<string>(this.mock.roles[0].id);
  confirmDelete = signal<boolean>(false);

  selectedRole = computed(() => this.roles().find(r => r.id === this.selectedRoleId()));

  perms = signal<Record<string, boolean>>(defaultPerms(this.mock.roles[0].name));

  activeCount = computed(() => Object.values(this.perms()).filter(Boolean).length);

  constructor() {
    // When role changes, reset perms to defaults for that role
    effect(() => {
      const r = this.selectedRole();
      if (r) this.perms.set(defaultPerms(r.name));
    }, { allowSignalWrites: true });
  }

  selectRole(id: string): void {
    this.selectedRoleId.set(id);
  }

  togglePerm(key: string, value: boolean): void {
    const r = this.selectedRole();
    if (!r || r.system) return;
    this.perms.update(p => ({ ...p, [key]: value }));
  }

  reset(): void {
    const r = this.selectedRole();
    if (!r) return;
    this.perms.set(defaultPerms(r.name));
    this.toast.show({ body: 'Berechtigungen zurückgesetzt' });
  }

  save(): void {
    this.toast.show({ kind: 'success', body: 'Berechtigungen gespeichert' });
  }

  createRole(): void {
    const id = 'r' + (this.roles().length + 1) + '-' + Date.now();
    const newRole: Role = { id, name: 'Neue Rolle', description: 'Benutzerdefinierte Rolle', users: 0, system: false };
    this.roles.update(rs => [...rs, newRole]);
    this.selectedRoleId.set(id);
    this.toast.show({ kind: 'success', body: 'Rolle erstellt' });
  }

  deleteRole(): void {
    const r = this.selectedRole();
    if (!r || r.system) return;
    this.roles.update(rs => rs.filter(x => x.id !== r.id));
    const first = this.roles()[0];
    if (first) this.selectedRoleId.set(first.id);
    this.toast.show({ kind: 'success', body: 'Rolle gelöscht' });
  }
}
