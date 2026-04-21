import { Component, inject } from '@angular/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../modal/modal.component';
import { IconComponent } from '../icon/icon.component';
import { Club } from '../../../core/models';

@Component({
  selector: 'app-club-switcher',
  standalone: true,
  imports: [ModalComponent, IconComponent],
  template: `
    <app-modal [open]="state.clubSwitcherOpen()" title="Verein wechseln" [width]="480" (closed)="close()">
      <div style="display:flex;flex-direction:column;gap:6px">
        @for (c of data.clubs; track c.id) {
          <button (click)="select(c)"
            [style.border]="'1px solid ' + (c.id === state.club().id ? 'var(--primary)' : 'var(--border)')"
            [style.background]="c.id === state.club().id ? 'var(--primary-subtle)' : 'var(--bg-elev)'"
            style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px;text-align:left">
            <div [style.background]="c.color" style="width:36px;height:36px;border-radius:8px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">{{ c.logo }}</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:600">{{ c.name }}</div>
              <div style="font-size:12px;color:var(--text-muted)">{{ c.members }} Mitglieder · {{ c.role }}</div>
            </div>
            @if (c.id === state.club().id) { <app-icon name="check" [size]="16" style="color:var(--primary)" /> }
          </button>
        }
      </div>
      <div class="divider"></div>
      <button class="btn" style="width:100%;justify-content:center" (click)="newClub()">
        <app-icon name="plus" [size]="14" /> Neuen Verein anlegen
      </button>
    </app-modal>
  `,
})
export class ClubSwitcherComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  close(): void { this.state.clubSwitcherOpen.set(false); }

  select(c: Club): void {
    this.state.club.set(c);
    this.close();
    this.toast.show('Gewechselt zu ' + c.name);
  }

  newClub(): void {
    this.close();
    this.state.authView.set('create');
  }
}
