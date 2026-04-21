import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { FormatChfPipe } from '../../shared/pipes/format-chf.pipe';
import { Member, Team } from '../../core/models';

type FilterTab = 'all' | 'open' | 'paid';

interface DuesRow {
  id: string;
  firstName: string;
  lastName: string;
  teams: string[];
  paid: boolean;
  amount: number;
  dueDate: Date;
}

@Component({
  selector: 'app-dues',
  standalone: true,
  imports: [FormsModule, IconComponent, AvatarComponent, FormatChfPipe],
  template: `
    <div style="padding:24px;display:flex;flex-direction:column;gap:16px;height:calc(100vh - var(--topbar-h))">
      <!-- Page header -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <h1 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em">Beiträge</h1>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Jahresübersicht {{ year }}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" type="button" (click)="exportCsv()">
            <app-icon name="download" [size]="13" /> CSV Export
          </button>
          <button class="btn" type="button" (click)="sendReminders()">
            <app-icon name="mail" [size]="13" /> Mahnung senden
          </button>
        </div>
      </div>

      <!-- Annual overview hero card -->
      <div class="card" style="padding:20px">
        <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">Jahresübersicht</div>
            <div style="font-size:30px;font-weight:600;letter-spacing:-0.02em">
              {{ paidTotal() | formatChf }}
              <span style="font-size:15px;font-weight:400;color:var(--text-muted)">/ {{ grandTotal() | formatChf }} eingegangen</span>
            </div>
          </div>
          <div style="display:flex;gap:24px">
            <div>
              <div style="font-size:11px;color:var(--text-muted)">Bezahlt</div>
              <div style="font-size:18px;font-weight:600;color:var(--success)">{{ paidCount() }}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-muted)">Offen</div>
              <div style="font-size:18px;font-weight:600;color:var(--danger)">{{ openCount() }}</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-muted)">Anteil</div>
              <div style="font-size:18px;font-weight:600">{{ paidPct() }}%</div>
            </div>
          </div>
        </div>
        <div style="height:10px;background:var(--bg-subtle);border-radius:5px;overflow:hidden">
          <div [style.width.%]="paidPct()" style="height:100%;background:linear-gradient(90deg, #059669, #10B981);transition:width .6s"></div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px">
          {{ paidCount() }} von {{ rows().length }} Mitglieder haben bezahlt ({{ paidPct() }}%)
        </div>
      </div>

      <!-- Filter tabs -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button
          type="button"
          (click)="tab.set('all')"
          [style.background]="tab() === 'all' ? 'var(--primary)' : 'var(--bg-elev)'"
          [style.color]="tab() === 'all' ? '#fff' : 'var(--text-secondary)'"
          [style.border]="'1px solid ' + (tab() === 'all' ? 'var(--primary)' : 'var(--border)')"
          style="padding:6px 14px;border-radius:var(--r-full);font-size:12px;font-weight:500;cursor:pointer">
          Alle ({{ rows().length }})
        </button>
        <button
          type="button"
          (click)="tab.set('open')"
          [style.background]="tab() === 'open' ? 'var(--danger)' : 'var(--bg-elev)'"
          [style.color]="tab() === 'open' ? '#fff' : 'var(--text-secondary)'"
          [style.border]="'1px solid ' + (tab() === 'open' ? 'var(--danger)' : 'var(--border)')"
          style="padding:6px 14px;border-radius:var(--r-full);font-size:12px;font-weight:500;cursor:pointer">
          Offen ({{ openCount() }})
        </button>
        <button
          type="button"
          (click)="tab.set('paid')"
          [style.background]="tab() === 'paid' ? 'var(--success)' : 'var(--bg-elev)'"
          [style.color]="tab() === 'paid' ? '#fff' : 'var(--text-secondary)'"
          [style.border]="'1px solid ' + (tab() === 'paid' ? 'var(--success)' : 'var(--border)')"
          style="padding:6px 14px;border-radius:var(--r-full);font-size:12px;font-weight:500;cursor:pointer">
          Bezahlt ({{ paidCount() }})
        </button>

        <div style="width:1px;height:20px;background:var(--border);margin:0 4px"></div>

        <select class="select" [ngModel]="teamFilter()" (ngModelChange)="teamFilter.set($event)" style="min-width:160px">
          <option value="">Alle Teams</option>
          @for (t of data.teams; track t.id) {
            <option [value]="t.id">{{ t.name }}</option>
          }
        </select>

        <div style="flex:1"></div>

        @if (selectedIds().size > 0) {
          <div style="display:flex;gap:8px;align-items:center">
            <span style="font-size:12px;color:var(--text-muted)">{{ selectedIds().size }} ausgewählt</span>
            <button class="btn btn-sm" type="button" (click)="bulkMarkPaid()">
              <app-icon name="check" [size]="12" /> Als bezahlt markieren
            </button>
            <button class="btn btn-sm" type="button" (click)="bulkReminder()">
              <app-icon name="mail" [size]="12" /> Mahnung senden
            </button>
            <button class="btn btn-ghost btn-sm" type="button" (click)="clearSelection()">
              <app-icon name="x" [size]="12" />
            </button>
          </div>
        }
      </div>

      <!-- Table -->
      <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column">
        <div style="overflow-y:auto">
          <table class="tbl" style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th style="width:36px;text-align:center">
                  <input type="checkbox" [checked]="allSelected()" (change)="toggleAll($event)" />
                </th>
                <th>Mitglied</th>
                <th>Team</th>
                <th>Betrag</th>
                <th>Fällig am</th>
                <th>Status</th>
                <th style="width:120px"></th>
              </tr>
            </thead>
            <tbody>
              @for (m of filtered(); track m.id) {
                <tr [style.background]="selectedIds().has(m.id) ? 'var(--bg-subtle)' : 'transparent'">
                  <td style="text-align:center">
                    <input type="checkbox" [checked]="selectedIds().has(m.id)" (change)="toggleSelect(m.id)" />
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <app-avatar [name]="m.firstName + ' ' + m.lastName" size="sm" />
                      <div style="font-weight:500">{{ m.firstName }} {{ m.lastName }}</div>
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;gap:3px;flex-wrap:wrap">
                      @for (tid of m.teams; track tid) {
                        @if (teamById(tid); as t) {
                          <span class="chip" [style.background]="t.color + '18'" [style.color]="t.color" style="border-color:transparent">{{ t.short }}</span>
                        }
                      }
                    </div>
                  </td>
                  <td style="font-weight:600;font-variant-numeric:tabular-nums">{{ m.amount | formatChf }}</td>
                  <td style="font-size:12px;color:var(--text-muted)">{{ formatDueDate(m.dueDate) }}</td>
                  <td>
                    @if (m.paid) {
                      <span class="badge badge-success">
                        <app-icon name="check" [size]="10" /> Bezahlt
                      </span>
                    } @else {
                      <span class="badge badge-danger">Offen</span>
                    }
                  </td>
                  <td>
                    <button
                      type="button"
                      (click)="togglePaid(m.id)"
                      [style.background]="m.paid ? 'var(--success)' : 'var(--bg-subtle)'"
                      [style.border]="'1px solid ' + (m.paid ? 'var(--success)' : 'var(--border)')"
                      [style.color]="m.paid ? '#fff' : 'var(--text-secondary)'"
                      style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:var(--r-full);font-size:11px;font-weight:500;cursor:pointer">
                      <div
                        [style.transform]="m.paid ? 'translateX(0)' : 'translateX(-2px)'"
                        style="width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.1)">
                      </div>
                      {{ m.paid ? 'Bezahlt' : 'Als bezahlt' }}
                    </button>
                  </td>
                </tr>
              }
              @if (filtered().length === 0) {
                <tr>
                  <td colspan="7" style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px">
                    Keine Mitglieder gefunden.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class DuesComponent {
  data = inject(MockDataService);
  toast = inject(ToastService);

  readonly year = new Date().getFullYear();

  tab = signal<FilterTab>('all');
  teamFilter = signal<string>('');
  selectedIds = signal<Set<string>>(new Set<string>());

  rows = signal<DuesRow[]>(this.buildRows());

  filtered = computed<DuesRow[]>(() => {
    const t = this.tab();
    const tf = this.teamFilter();
    return this.rows().filter(m => {
      if (t === 'paid' && !m.paid) return false;
      if (t === 'open' && m.paid) return false;
      if (tf !== '' && !m.teams.includes(tf)) return false;
      return true;
    });
  });

  grandTotal = computed<number>(() => this.rows().reduce((s, m) => s + m.amount, 0));
  paidTotal = computed<number>(() => this.rows().filter(m => m.paid).reduce((s, m) => s + m.amount, 0));
  paidCount = computed<number>(() => this.rows().filter(m => m.paid).length);
  openCount = computed<number>(() => this.rows().filter(m => !m.paid).length);
  paidPct = computed<number>(() => {
    const g = this.grandTotal();
    return g === 0 ? 0 : Math.round((this.paidTotal() / g) * 100);
  });

  allSelected = computed<boolean>(() => {
    const f = this.filtered();
    if (f.length === 0) return false;
    const sel = this.selectedIds();
    return f.every(m => sel.has(m.id));
  });

  private buildRows(): DuesRow[] {
    const due = new Date(new Date().getFullYear(), 2, 31); // 31.03
    return this.data.members.map(m => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      teams: m.teams,
      paid: m.paid,
      amount: m.paid ? 250 : m.dueAmount || 250,
      dueDate: due,
    }));
  }

  teamById(id: string): Team | undefined {
    return this.data.teams.find(t => t.id === id);
  }

  formatDueDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
  }

  togglePaid(id: string): void {
    // Optimistic update
    this.rows.update(rs => rs.map(r => r.id === id ? { ...r, paid: !r.paid } : r));
    const updated = this.rows().find(r => r.id === id);
    this.toast.show({
      kind: 'success',
      body: updated?.paid ? `${updated.firstName} ${updated.lastName} als bezahlt markiert.` : `Zahlung für ${updated?.firstName} ${updated?.lastName} zurückgesetzt.`,
    });
  }

  toggleSelect(id: string): void {
    const s = new Set(this.selectedIds());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.selectedIds.set(s);
  }

  toggleAll(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    const s = new Set(this.selectedIds());
    for (const m of this.filtered()) {
      if (checked) s.add(m.id); else s.delete(m.id);
    }
    this.selectedIds.set(s);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set<string>());
  }

  bulkMarkPaid(): void {
    const ids = this.selectedIds();
    this.rows.update(rs => rs.map(r => ids.has(r.id) ? { ...r, paid: true } : r));
    this.toast.show({ kind: 'success', title: `${ids.size} Mitglieder`, body: 'Als bezahlt markiert.' });
    this.clearSelection();
  }

  bulkReminder(): void {
    const n = this.selectedIds().size;
    this.toast.show({ kind: 'success', title: 'Mahnungen versendet', body: `${n} Erinnerungen versendet.` });
    this.clearSelection();
  }

  exportCsv(): void {
    this.toast.show({ kind: 'success', body: 'CSV-Export wird erstellt …' });
  }

  sendReminders(): void {
    const open = this.rows().filter(m => !m.paid).length;
    this.toast.show({ kind: 'success', title: 'Mahnungen versendet', body: `${open} Mitglieder wurden benachrichtigt.` });
  }
}
