import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../core/services/app-state.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import { InviteCode } from '../../core/models';

type StatusFilter = 'all' | 'active' | 'expired' | 'used' | 'revoked';

interface NewCodeForm {
  prefix: string;
  roleIds: string[];
  teamId: string;
  maxUses: string;
  expiresInDays: string;
  note: string;
}

function randomCode(prefix: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix.toUpperCase()}-${s}`;
}

@Component({
  selector: 'app-invites',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalComponent, ConfirmDialogComponent, EmptyStateComponent, FormatDatePipe],
  template: `
    <div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;height:calc(100vh - var(--topbar-h))">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <h1 style="font-size:22px;font-weight:600;letter-spacing:-0.02em;margin:0">Einladungscodes</h1>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px">
            Mitglieder treten mit einem Code bei — keine direkten Einladungen mehr nötig.
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" (click)="exportList()">
            <app-icon name="download" [size]="13" /> Exportieren
          </button>
          <button class="btn btn-primary" (click)="openCreate()">
            <app-icon name="plus" [size]="13" /> Code erstellen
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        <div class="card" style="padding:14px 16px">
          <div style="font-size:11px;color:var(--text-muted);font-weight:500">Aktiv</div>
          <div style="font-size:22px;font-weight:600;margin-top:4px;color:var(--success)">{{ stats().active }}</div>
        </div>
        <div class="card" style="padding:14px 16px">
          <div style="font-size:11px;color:var(--text-muted);font-weight:500">Genutzt (gesamt)</div>
          <div style="font-size:22px;font-weight:600;margin-top:4px">{{ stats().totalUses }}</div>
        </div>
        <div class="card" style="padding:14px 16px">
          <div style="font-size:11px;color:var(--text-muted);font-weight:500">Abgelaufen</div>
          <div style="font-size:22px;font-weight:600;margin-top:4px;color:var(--warning)">{{ stats().expired }}</div>
        </div>
        <div class="card" style="padding:14px 16px">
          <div style="font-size:11px;color:var(--text-muted);font-weight:500">Widerrufen</div>
          <div style="font-size:22px;font-weight:600;margin-top:4px;color:var(--text-muted)">{{ stats().revoked }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        @for (f of filters; track f.k) {
          <button (click)="filter.set(f.k)"
            [style.background]="filter() === f.k ? 'var(--primary-subtle)' : 'var(--bg-elev)'"
            [style.color]="filter() === f.k ? 'var(--primary)' : 'var(--text-secondary)'"
            [style.border-color]="filter() === f.k ? 'var(--primary-subtle-border)' : 'var(--border)'"
            style="padding:5px 12px;font-size:12px;font-weight:500;border-radius:999px;border:1px solid">
            {{ f.l }}
          </button>
        }
        <div style="flex:1"></div>
        <input class="input" placeholder="Code oder Notiz suchen …" [ngModel]="q()" (ngModelChange)="q.set($event)" style="width:260px" />
      </div>

      <!-- Table -->
      <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
        @if (filtered().length === 0) {
          <app-empty-state
            emoji="🎟️"
            title="Keine Einladungscodes"
            body="Erstelle einen Code, den du per E-Mail oder Chat an neue Mitglieder weitergeben kannst.">
            <button class="btn btn-primary" (click)="openCreate()">
              <app-icon name="plus" [size]="13" /> Code erstellen
            </button>
          </app-empty-state>
        } @else {
          <div style="overflow:auto;flex:1">
            <table class="tbl" style="min-width:900px">
              <thead>
                <tr>
                  <th style="min-width:240px">Code</th>
                  <th style="min-width:130px">Rolle</th>
                  <th style="width:80px">Team</th>
                  <th style="width:110px">Nutzungen</th>
                  <th style="width:110px">Gültig bis</th>
                  <th style="width:160px">Erstellt</th>
                  <th style="width:120px">Status</th>
                  <th style="width:130px"></th>
                </tr>
              </thead>
              <tbody>
                @for (c of filtered(); track c.id) {
                  <tr>
                    <td style="padding-top:10px;padding-bottom:10px">
                      <code style="display:inline-block;font-family:ui-monospace,SFMono-Regular,monospace;font-size:12px;padding:4px 10px;border-radius:6px;background:var(--bg-subtle);letter-spacing:0.06em;font-weight:600;color:var(--text);white-space:nowrap">
                        {{ c.code }}
                      </code>
                      @if (c.note) {
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;max-width:230px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" [title]="c.note">{{ c.note }}</div>
                      }
                    </td>
                    <td>
                      <div style="display:flex;gap:4px;flex-wrap:wrap">
                        @for (rid of c.roleIds; track rid) {
                          <span class="chip">{{ roleName(rid) }}</span>
                        }
                      </div>
                    </td>
                    <td>
                      @if (c.teamId; as tid) {
                        @if (teamById(tid); as t) {
                          <span class="chip" [style.background]="t.color + '22'" [style.color]="t.color" style="border-color:transparent">
                            {{ t.short }}
                          </span>
                        }
                      } @else {
                        <span style="font-size:11px;color:var(--text-muted)">–</span>
                      }
                    </td>
                    <td style="font-variant-numeric:tabular-nums">
                      @if (c.maxUses === null) {
                        {{ c.usedCount }} / ∞
                      } @else {
                        <span [style.color]="c.usedCount >= c.maxUses ? 'var(--warning)' : undefined">
                          {{ c.usedCount }} / {{ c.maxUses }}
                        </span>
                      }
                    </td>
                    <td style="font-size:12px;color:var(--text-secondary)">
                      @if (c.expiresAt) {
                        {{ c.expiresAt | formatDate }}
                      } @else {
                        <span style="color:var(--text-muted)">unbefristet</span>
                      }
                    </td>
                    <td style="font-size:12px;color:var(--text-muted);white-space:nowrap">
                      {{ c.createdAt | formatDate }}
                      <div style="font-size:11px;margin-top:2px">von {{ c.createdBy }}</div>
                    </td>
                    <td>
                      @switch (statusOf(c)) {
                        @case ('active') { <span class="badge badge-success">Aktiv</span> }
                        @case ('expired') { <span class="badge badge-warning">Abgelaufen</span> }
                        @case ('used') { <span class="badge">Aufgebraucht</span> }
                        @case ('revoked') { <span class="badge badge-danger">Widerrufen</span> }
                      }
                    </td>
                    <td>
                      <div style="display:flex;gap:4px;justify-content:flex-end">
                        <button class="btn btn-ghost btn-icon" style="height:28px;width:28px" title="Kopieren" (click)="copy(c)">
                          <app-icon name="box" [size]="13" />
                        </button>
                        <button class="btn btn-ghost btn-icon" style="height:28px;width:28px" title="Teilen" (click)="share(c)">
                          <app-icon name="upload" [size]="13" />
                        </button>
                        @if (c.status === 'active') {
                          <button class="btn btn-ghost btn-icon" style="height:28px;width:28px" title="Widerrufen" (click)="confirmRevoke.set(c.id)">
                            <app-icon name="trash" [size]="13" />
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- Create modal -->
    <app-modal [open]="createOpen()" title="Einladungscode erstellen" [width]="560" (closed)="createOpen.set(false)">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label class="label">Präfix</label>
          <input class="input" [(ngModel)]="newForm.prefix" (ngModelChange)="regenerate()" name="prefix" placeholder="z.B. FCS oder U15">
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
            Der Code wird automatisch erzeugt: <code style="font-family:ui-monospace;background:var(--bg-subtle);padding:1px 6px;border-radius:3px">{{ previewCode() }}</code>
          </div>
        </div>
        <div>
          <label class="label">Rollen beim Beitritt (Mehrfachauswahl)</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-subtle)">
            @for (r of data.roles; track r.id) {
              <button type="button" (click)="toggleNewRole(r.id)"
                [style.background]="newForm.roleIds.includes(r.id) ? 'var(--primary)' : 'var(--bg-elev)'"
                [style.color]="newForm.roleIds.includes(r.id) ? '#fff' : 'var(--text-secondary)'"
                [style.border-color]="newForm.roleIds.includes(r.id) ? 'var(--primary)' : 'var(--border)'"
                style="padding:4px 10px;border-radius:999px;border:1px solid;font-size:12px;display:inline-flex;align-items:center;gap:4px;cursor:pointer">
                @if (newForm.roleIds.includes(r.id)) {
                  <app-icon name="check" [size]="10" />
                }
                {{ r.name }}
              </button>
            }
          </div>
          @if (newForm.roleIds.length === 0) {
            <div style="font-size:11px;color:var(--danger);margin-top:4px">Mindestens eine Rolle auswählen.</div>
          } @else {
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">{{ newForm.roleIds.length }} {{ newForm.roleIds.length === 1 ? 'Rolle ausgewählt' : 'Rollen ausgewählt' }}</div>
          }
        </div>
        <div>
          <label class="label">Team (optional)</label>
          <select class="select" [(ngModel)]="newForm.teamId" name="teamId">
            <option value="">Kein Team</option>
            @for (t of data.teams; track t.id) {
              <option [value]="t.id">{{ t.name }}</option>
            }
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label class="label">Max. Nutzungen</label>
            <input class="input" type="number" min="0" [(ngModel)]="newForm.maxUses" name="maxUses" placeholder="Leer = unbegrenzt">
          </div>
          <div>
            <label class="label">Gültigkeit</label>
            <select class="select" [(ngModel)]="newForm.expiresInDays" name="expires">
              <option value="7">7 Tage</option>
              <option value="30">30 Tage</option>
              <option value="90">90 Tage</option>
              <option value="365">1 Jahr</option>
              <option value="">Unbefristet</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Notiz (optional)</label>
          <input class="input" [(ngModel)]="newForm.note" name="note" placeholder="z.B. 'Frühjahrsakquise 2026'">
        </div>
      </div>
      <ng-container ngProjectAs="[slot=footer]">
        <button class="btn" (click)="createOpen.set(false)">Abbrechen</button>
        <button class="btn btn-primary" (click)="createCode()">
          <app-icon name="check" [size]="13" /> Code erstellen
        </button>
      </ng-container>
    </app-modal>

    <!-- Share modal -->
    <app-modal [open]="!!shareCode()" [title]="'Code teilen: ' + shareCode()?.code" [width]="520" (closed)="shareCode.set(null)">
      @if (shareCode(); as c) {
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="padding:16px;background:var(--bg-subtle);border-radius:10px;text-align:center">
            <code style="font-family:ui-monospace,SFMono-Regular,monospace;font-size:22px;font-weight:700;letter-spacing:0.08em;color:var(--primary)">{{ c.code }}</code>
          </div>
          <div>
            <label class="label">Einladungslink</label>
            <div style="display:flex;gap:6px">
              <input class="input" readonly [value]="inviteLink(c)" #linkInput>
              <button class="btn" (click)="copyText(inviteLink(c))">
                <app-icon name="box" [size]="13" /> Kopieren
              </button>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <a [href]="mailtoLink(c)" class="btn" style="flex:1;justify-content:center">
              <app-icon name="mail" [size]="13" /> Per E-Mail
            </a>
            <a [href]="whatsappLink(c)" target="_blank" rel="noopener" class="btn" style="flex:1;justify-content:center">
              <app-icon name="phone" [size]="13" /> Via WhatsApp
            </a>
          </div>
          <div style="padding:10px 12px;background:var(--bg-subtle);border-radius:8px;font-size:12px;color:var(--text-muted);line-height:1.55">
            Neue Mitglieder verwenden den Code beim Registrieren oder Beitreten auf <strong>{{ host() }}</strong>.
            Nach erfolgreicher Verifizierung werden sie automatisch den Rollen
            <strong>{{ roleNames(c.roleIds) }}</strong>
            @if (c.teamId) { und dem Team "<strong>{{ teamById(c.teamId)?.name }}</strong>"}
            zugeordnet.
          </div>
        </div>
      }
    </app-modal>

    <!-- Revoke confirm -->
    <app-confirm-dialog
      [open]="confirmRevoke() !== null"
      title="Code widerrufen?"
      body="Der Code kann danach nicht mehr verwendet werden. Bereits beigetretene Mitglieder bleiben erhalten."
      confirmLabel="Widerrufen"
      [danger]="true"
      (closed)="confirmRevoke.set(null)"
      (confirmed)="doRevoke()" />
  `,
})
export class InvitesComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  filters = [
    { k: 'all' as StatusFilter, l: 'Alle' },
    { k: 'active' as StatusFilter, l: 'Aktiv' },
    { k: 'expired' as StatusFilter, l: 'Abgelaufen' },
    { k: 'used' as StatusFilter, l: 'Aufgebraucht' },
    { k: 'revoked' as StatusFilter, l: 'Widerrufen' },
  ];

  filter = signal<StatusFilter>('all');
  q = signal<string>('');

  createOpen = signal<boolean>(false);
  confirmRevoke = signal<string | null>(null);
  shareCode = signal<InviteCode | null>(null);

  newForm: NewCodeForm = {
    prefix: 'FCS',
    roleIds: ['r5'],
    teamId: '',
    maxUses: '',
    expiresInDays: '30',
    note: '',
  };

  toggleNewRole(id: string): void {
    const i = this.newForm.roleIds.indexOf(id);
    if (i >= 0) this.newForm.roleIds.splice(i, 1);
    else this.newForm.roleIds.push(id);
  }

  previewCode = signal<string>(randomCode('FCS'));

  host = computed(() => {
    try { return window.location.host; } catch { return 'hubby.ch'; }
  });

  statusOf(c: InviteCode): 'active' | 'expired' | 'used' | 'revoked' {
    if (c.status === 'revoked') return 'revoked';
    if (c.maxUses !== null && c.usedCount >= c.maxUses) return 'used';
    if (c.expiresAt && c.expiresAt.getTime() < Date.now()) return 'expired';
    return 'active';
  }

  stats = computed(() => {
    const codes = this.data.inviteCodes();
    let active = 0, expired = 0, revoked = 0, totalUses = 0;
    for (const c of codes) {
      totalUses += c.usedCount;
      const s = this.statusOf(c);
      if (s === 'active') active++;
      else if (s === 'expired') expired++;
      else if (s === 'revoked') revoked++;
    }
    return { active, expired, revoked, totalUses };
  });

  filtered = computed(() => {
    const codes = this.data.inviteCodes();
    const f = this.filter();
    const query = this.q().toLowerCase().trim();
    return codes.filter(c => {
      if (f !== 'all' && this.statusOf(c) !== f) return false;
      if (query && !c.code.toLowerCase().includes(query) && !c.note.toLowerCase().includes(query)) return false;
      return true;
    });
  });

  roleName(id: string): string {
    return this.data.getRole(id)?.name ?? '–';
  }

  roleNames(ids: string[]): string {
    return ids.map(id => '"' + this.roleName(id) + '"').join(', ');
  }

  teamById(id: string | null) {
    return id ? this.data.getTeam(id) : undefined;
  }

  openCreate(): void {
    this.createOpen.set(true);
    this.regenerate();
  }

  regenerate(): void {
    const prefix = this.newForm.prefix.trim() || 'CODE';
    this.previewCode.set(randomCode(prefix));
  }

  createCode(): void {
    const prefix = this.newForm.prefix.trim();
    if (!prefix) {
      this.toast.show({ kind: 'error', body: 'Bitte Präfix angeben.' });
      return;
    }
    if (this.newForm.roleIds.length === 0) {
      this.toast.show({ kind: 'error', body: 'Mindestens eine Rolle auswählen.' });
      return;
    }
    const maxUsesNum = this.newForm.maxUses.trim() ? parseInt(this.newForm.maxUses, 10) : null;
    const expiryDays = this.newForm.expiresInDays.trim() ? parseInt(this.newForm.expiresInDays, 10) : null;
    const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 3600 * 1000) : null;

    const code: InviteCode = {
      id: 'inv-' + Date.now(),
      code: this.previewCode(),
      roleIds: [...this.newForm.roleIds],
      teamId: this.newForm.teamId || null,
      maxUses: maxUsesNum,
      usedCount: 0,
      expiresAt,
      note: this.newForm.note.trim(),
      createdAt: new Date(),
      createdBy: this.state.user().name,
      status: 'active',
    };
    this.data.addInviteCode(code);
    this.toast.show({ kind: 'success', title: 'Code erstellt', body: code.code });
    this.createOpen.set(false);
    this.shareCode.set(code);
  }

  doRevoke(): void {
    const id = this.confirmRevoke();
    if (!id) return;
    this.data.updateInviteCode(id, { status: 'revoked' });
    this.toast.show({ kind: 'warning', body: 'Code wurde widerrufen.' });
    this.confirmRevoke.set(null);
  }

  copy(c: InviteCode): void {
    this.copyText(c.code);
  }

  copyText(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => this.toast.show({ kind: 'success', body: 'In Zwischenablage kopiert' }),
        () => this.toast.show({ kind: 'error', body: 'Kopieren fehlgeschlagen' }),
      );
    }
  }

  share(c: InviteCode): void {
    this.shareCode.set(c);
  }

  inviteLink(c: InviteCode): string {
    try { return `${window.location.origin}${window.location.pathname}?join=${c.code}`; }
    catch { return `https://hubby.ch/join?code=${c.code}`; }
  }

  mailtoLink(c: InviteCode): string {
    const subject = encodeURIComponent(`Einladung zu ${this.state.club().name} bei Hubby`);
    const body = encodeURIComponent(
      `Hallo,\n\nhiermit lade ich dich zu "${this.state.club().name}" auf Hubby ein.\n\nEinladungscode: ${c.code}\nLink: ${this.inviteLink(c)}\n\nBis bald!`
    );
    return `mailto:?subject=${subject}&body=${body}`;
  }

  whatsappLink(c: InviteCode): string {
    const text = encodeURIComponent(
      `Hallo, hier ist dein Einladungscode für ${this.state.club().name}: ${c.code}\n${this.inviteLink(c)}`
    );
    return `https://wa.me/?text=${text}`;
  }

  exportList(): void {
    this.toast.show({ kind: 'success', body: 'CSV-Export erstellt' });
  }
}
