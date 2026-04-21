import { Component, computed, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppStateService } from '../../core/services/app-state.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { Member } from '../../core/models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FormatChfPipe } from '../../shared/pipes/format-chf.pipe';
import { MemberDrawerComponent } from './member-drawer.component';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    FormsModule,
    IconComponent,
    AvatarComponent,
    EmptyStateComponent,
    FormatChfPipe,
    MemberDrawerComponent,
  ],
  template: `
    <div style="padding:20px 24px;display:flex;flex-direction:column;gap:12px;height:calc(100vh - var(--topbar-h))">
      <!-- Page header -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
        <div>
          <h1 style="font-size:22px;font-weight:600;letter-spacing:-0.02em;margin:0">Mitglieder</h1>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px">
            {{ activeCount() }} aktive Mitglieder · {{ unpaidCount() }} mit offenem Beitrag · {{ filtered().length }} von {{ data.members.length }} angezeigt
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button class="btn" (click)="exportCsv()">
            <app-icon name="download" [size]="13" /> Exportieren
          </button>
          <button class="btn btn-primary" (click)="router.navigate(['/invites'])">
            <app-icon name="key" [size]="13" /> Einladungscodes
          </button>
        </div>
      </div>

      <!-- Filter bar -->
      <div style="display:flex;gap:8px;align-items:center">
        <div style="position:relative;flex:1;min-width:200px">
          <app-icon name="search" [size]="14"
            style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);pointer-events:none" />
          <input
            class="input"
            placeholder="Name, E-Mail oder Telefon …"
            [ngModel]="q()"
            (ngModelChange)="q.set($event)"
            style="padding-left:30px">
        </div>
        <select class="select" [ngModel]="teamFilter()" (ngModelChange)="teamFilter.set($event)" style="width:160px;flex-shrink:0">
          <option value="">Alle Teams</option>
          @for (t of data.teams; track t.id) {
            <option [value]="t.id">{{ t.name }}</option>
          }
        </select>
        <select class="select" [ngModel]="roleFilter()" (ngModelChange)="roleFilter.set($event)" style="width:160px;flex-shrink:0">
          <option value="">Alle Rollen</option>
          @for (r of data.roles; track r.id) {
            <option [value]="r.id">{{ r.name }}</option>
          }
        </select>
        <select class="select" [ngModel]="payFilter()" (ngModelChange)="payFilter.set($event)" style="width:140px;flex-shrink:0">
          <option value="">Alle Beiträge</option>
          <option value="paid">Bezahlt</option>
          <option value="open">Offen</option>
        </select>
        @if (hasFilters()) {
          <button class="btn btn-ghost btn-sm" (click)="resetFilters()" style="flex-shrink:0">
            <app-icon name="x" [size]="12" /> Zurücksetzen
          </button>
        }
      </div>

      <!-- Bulk actions bar -->
      @if (selectedIds().size > 0) {
        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--primary-subtle);border:1px solid var(--primary-subtle-border);border-radius:8px">
          <span style="font-size:13px;font-weight:500;color:var(--primary)">
            {{ selectedIds().size }} ausgewählt
          </span>
          <div style="flex:1"></div>
          <button class="btn btn-sm" (click)="bulkEmail()">
            <app-icon name="mail" [size]="12" /> E-Mail senden
          </button>
          <button class="btn btn-sm" (click)="bulkExport()">
            <app-icon name="download" [size]="12" /> CSV Export
          </button>
          <button class="btn btn-sm" (click)="bulkAssign()">
            <app-icon name="users" [size]="12" /> Team zuweisen
          </button>
          <button class="btn btn-ghost btn-sm" (click)="clearSelection()">
            <app-icon name="x" [size]="12" />
          </button>
        </div>
      }

      <!-- Table -->
      <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0">
        <div style="overflow-y:auto;flex:1">
          <table class="tbl">
            <thead>
              <tr>
                <th style="width:36px">
                  <input type="checkbox" [checked]="allSelected()" (change)="toggleAll()">
                </th>
                <th>Mitglied</th>
                <th>Teams</th>
                <th>Rolle</th>
                <th>Beitrag</th>
                <th>Letztes Login</th>
                <th style="width:40px"></th>
              </tr>
            </thead>
            <tbody>
              @for (m of paginated(); track m.id) {
                <tr (click)="openMember(m)" style="cursor:pointer">
                  <td (click)="$event.stopPropagation()">
                    <input type="checkbox" [checked]="selectedIds().has(m.id)" (change)="toggleOne(m.id)">
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <app-avatar [name]="m.firstName + ' ' + m.lastName" size="sm" />
                      <div style="min-width:0">
                        <div style="font-weight:500;font-size:13px">{{ m.firstName }} {{ m.lastName }}</div>
                        <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px">
                          {{ m.email }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap">
                      @for (tid of m.teams; track tid) {
                        @if (teamById(tid); as t) {
                          <span class="chip"
                            [style.background]="t.color + '18'"
                            [style.color]="t.color"
                            style="border-color:transparent">{{ t.short }}</span>
                        }
                      }
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap">
                      @for (rid of m.roleIds; track rid) {
                        <span class="chip">{{ roleName(rid) }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    @if (m.paid) {
                      <span class="badge badge-success">
                        <app-icon name="check" [size]="10" /> Bezahlt
                      </span>
                    } @else {
                      <span class="badge badge-danger">{{ m.dueAmount | formatChf }} offen</span>
                    }
                  </td>
                  <td style="font-size:12px;color:var(--text-muted)">{{ m.lastLogin }}</td>
                  <td (click)="$event.stopPropagation()">
                    <button class="btn btn-ghost btn-icon" style="height:28px;width:28px" (click)="openMenu(m.id)">
                      <app-icon name="more" [size]="14" />
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (filtered().length === 0) {
            <app-empty-state
              emoji="👥"
              title="Keine Mitglieder gefunden"
              body="Passe die Filter an oder erstelle einen Einladungscode.">
              <button class="btn btn-primary" (click)="router.navigate(['/invites'])">
                <app-icon name="key" [size]="13" /> Einladungscode erstellen
              </button>
            </app-empty-state>
          }
        </div>

        <!-- Pagination footer -->
        @if (filtered().length > 0) {
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid var(--border);flex-shrink:0">
            <div style="font-size:12px;color:var(--text-muted)">
              {{ pageStart() }}–{{ pageEnd() }} von {{ filtered().length }}
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <button class="btn btn-sm btn-ghost" [disabled]="page() === 1" (click)="prevPage()">
                <app-icon name="chevronLeft" [size]="12" /> Zurück
              </button>
              <span style="font-size:12px;color:var(--text-muted);padding:0 6px">
                Seite {{ page() }} / {{ totalPages() }}
              </span>
              <button class="btn btn-sm btn-ghost" [disabled]="page() >= totalPages()" (click)="nextPage()">
                Weiter <app-icon name="chevronRight" [size]="12" />
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Member detail drawer -->
    <app-member-drawer />
  `,
})
export class MembersComponent {
  state = inject(AppStateService);
  router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  constructor() {
    // Sync ?open=<id> query param → drawer state
    this.activatedRoute.queryParamMap.subscribe(qp => {
      const id = qp.get('open');
      if (id) {
        const m = this.data.members.find(x => x.id === id);
        if (m) this.state.openMember(m);
      } else if (this.state.memberOpen()) {
        this.state.closeMember();
      }
    });
  }

  openMember(m: Member): void {
    this.router.navigate([], { queryParams: { open: m.id }, queryParamsHandling: 'merge' });
  }
  data = inject(MockDataService);
  toast = inject(ToastService);

  // Filters
  q = signal<string>('');
  teamFilter = signal<string>('');
  roleFilter = signal<string>('');
  payFilter = signal<string>('');

  // Selection
  selectedIds = signal<Set<string>>(new Set<string>());

  // Pagination
  page = signal<number>(1);
  pageSize = 20;

  activeCount = computed(() => this.data.members.length);
  unpaidCount = computed(() => this.data.members.filter(m => !m.paid).length);

  hasFilters = computed(() =>
    !!this.q() || !!this.teamFilter() || !!this.roleFilter() || !!this.payFilter()
  );

  filtered = computed<Member[]>(() => {
    const query = this.q().trim().toLowerCase();
    const tf = this.teamFilter();
    const rf = this.roleFilter();
    const pf = this.payFilter();
    return this.data.members.filter(m => {
      if (query) {
        const hay = `${m.firstName} ${m.lastName} ${m.email} ${m.phone}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (tf && !m.teams.includes(tf)) return false;
      if (rf && !m.roleIds.includes(rf)) return false;
      if (pf === 'paid' && !m.paid) return false;
      if (pf === 'open' && m.paid) return false;
      return true;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  paginated = computed<Member[]>(() => {
    // Clamp page if filter changes
    const p = Math.min(this.page(), this.totalPages());
    const start = (p - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  pageStart = computed(() => (this.filtered().length === 0 ? 0 : (this.page() - 1) * this.pageSize + 1));
  pageEnd = computed(() => Math.min(this.page() * this.pageSize, this.filtered().length));

  allSelected = computed(() => {
    const list = this.paginated();
    const sel = this.selectedIds();
    return list.length > 0 && list.every(m => sel.has(m.id));
  });

  // --- Helpers ---
  teamById(id: string) {
    return this.data.teams.find(t => t.id === id);
  }

  roleName(id: string): string {
    return this.data.getRole(id)?.name ?? '';
  }

  // --- Filter actions ---
  resetFilters(): void {
    this.q.set('');
    this.teamFilter.set('');
    this.roleFilter.set('');
    this.payFilter.set('');
    this.page.set(1);
  }

  // --- Selection ---
  toggleAll(): void {
    const list = this.paginated();
    const sel = new Set(this.selectedIds());
    if (list.every(m => sel.has(m.id))) {
      list.forEach(m => sel.delete(m.id));
    } else {
      list.forEach(m => sel.add(m.id));
    }
    this.selectedIds.set(sel);
  }

  toggleOne(id: string): void {
    const sel = new Set(this.selectedIds());
    if (sel.has(id)) sel.delete(id); else sel.add(id);
    this.selectedIds.set(sel);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // --- Bulk actions ---
  bulkEmail(): void {
    this.toast.show({ kind: 'success', body: `E-Mail an ${this.selectedIds().size} Mitglieder gesendet.` });
    this.clearSelection();
  }

  bulkExport(): void {
    this.toast.show({ kind: 'success', body: `${this.selectedIds().size} Mitglieder als CSV exportiert.` });
  }

  bulkAssign(): void {
    this.toast.show({ body: 'Team-Zuweisung (Demo).' });
  }

  exportCsv(): void {
    this.toast.show({ kind: 'success', body: `${this.filtered().length} Mitglieder exportiert.` });
  }

  openMenu(_id: string): void {
    this.toast.show({ body: 'Kontextmenü (Demo).' });
  }

  // --- Pagination ---
  prevPage(): void {
    if (this.page() > 1) this.page.update(p => p - 1);
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) this.page.update(p => p + 1);
  }
}
