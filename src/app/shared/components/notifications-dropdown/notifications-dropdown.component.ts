import { Component, inject } from '@angular/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { IconComponent } from '../icon/icon.component';

const NOTIFS = [
  { icon: 'alert', c: 'var(--warning)', t: '5 Mitglieder haben Jahresbeitrag noch nicht bezahlt', s: 'vor 2 Std' },
  { icon: 'mail', c: 'var(--info)', t: 'Dario Rossi hat auf deine Einladung geantwortet', s: 'vor 4 Std' },
  { icon: 'calendar', c: 'var(--primary)', t: 'Match "vs. FC Altdorf" startet in 1 Tag', s: 'gestern' },
];

@Component({
  selector: 'app-notifications-dropdown',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (state.notifOpen()) {
      <div style="position:fixed;top:54px;right:20px;width:360px;background:var(--bg-elev);border:1px solid var(--border);border-radius:10px;box-shadow:var(--shadow-lg);z-index:40"
        (click)="$event.stopPropagation()">
        <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between">
          <div style="font-size:13px;font-weight:600">Benachrichtigungen</div>
          <button class="btn btn-ghost btn-sm" (click)="state.notifOpen.set(false)">Alle gelesen</button>
        </div>
        <div style="max-height:380px;overflow-y:auto">
          @for (n of notifs; track $index) {
            <div style="padding:10px 16px;border-bottom:1px solid var(--border);display:flex;gap:10px">
              <div [style.color]="n.c" style="width:24px;height:24px;border-radius:50%;background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <app-icon [name]="n.icon" [size]="12" />
              </div>
              <div style="flex:1">
                <div style="font-size:12.5px;line-height:1.4">{{ n.t }}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">{{ n.s }}</div>
              </div>
            </div>
          }
        </div>
      </div>
      <div style="position:fixed;inset:0;z-index:30" (click)="state.notifOpen.set(false)"></div>
    }
  `,
})
export class NotificationsDropdownComponent {
  state = inject(AppStateService);
  notifs = NOTIFS;
}
