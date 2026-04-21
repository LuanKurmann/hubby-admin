import { Component, inject } from '@angular/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthShellComponent } from '../auth-shell.component';
import { HubbyLogoComponent } from '../hubby-logo.component';

@Component({
  selector: 'app-create-or-join',
  standalone: true,
  imports: [IconComponent, AuthShellComponent, HubbyLogoComponent],
  template: `
    <app-auth-shell>
      <div class="brand">
        <app-hubby-logo />
        <div class="brand-name">Hubby</div>
      </div>
      <h2 class="heading">Willkommen bei Hubby</h2>
      <div class="subtitle">Lege einen neuen Verein an oder tritt einem bestehenden bei.</div>

      <div class="cards">
        <button type="button" class="choice-card" (click)="createClub()">
          <div class="icon-bubble primary-bubble">
            <app-icon name="plus" [size]="18" />
          </div>
          <div class="text-col">
            <div class="choice-title">Neuen Verein erstellen</div>
            <div class="choice-sub">Starte bei null und richte deinen Verein ein.</div>
          </div>
          <app-icon name="chevronRight" [size]="14" />
        </button>

        <button type="button" class="choice-card" (click)="joinClub()">
          <div class="icon-bubble info-bubble">
            <app-icon name="users" [size]="18" />
          </div>
          <div class="text-col">
            <div class="choice-title">Bestehendem Verein beitreten</div>
            <div class="choice-sub">Du hast einen Einladungslink? Hier eingeben.</div>
          </div>
          <app-icon name="chevronRight" [size]="14" />
        </button>
      </div>
    </app-auth-shell>
  `,
  styles: [`
    .brand { margin-bottom: 32px; display: flex; align-items: center; gap: 10px; }
    .brand-name { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
    .heading { font-size: 24px; font-weight: 600; margin: 0 0 6px; letter-spacing: -0.02em; }
    .subtitle { font-size: 13px; color: var(--text-muted); margin-bottom: 28px; }
    .cards { display: flex; flex-direction: column; gap: 12px; }
    .choice-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      border-radius: 10px;
      background: var(--bg-elev);
      border: 1px solid var(--border);
      text-align: left;
      cursor: pointer;
      transition: border-color .1s, box-shadow .1s;
      color: var(--text);
    }
    .choice-card:hover {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-subtle);
    }
    .icon-bubble {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .primary-bubble {
      background: var(--primary-subtle);
      color: var(--primary);
    }
    .info-bubble {
      background: var(--info-bg);
      color: var(--info);
    }
    .text-col {
      flex: 1;
      min-width: 0;
    }
    .choice-title {
      font-size: 14px;
      font-weight: 600;
    }
    .choice-sub {
      font-size: 12px;
      color: var(--text-muted);
    }
  `],
})
export class CreateOrJoinComponent {
  state = inject(AppStateService);

  createClub(): void {
    this.state.authView.set('create');
  }

  joinClub(): void {
    this.state.authView.set('join');
  }
}
