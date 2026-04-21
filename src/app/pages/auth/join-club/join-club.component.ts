import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../../core/services/app-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthShellComponent } from '../auth-shell.component';
import { HubbyLogoComponent } from '../hubby-logo.component';

@Component({
  selector: 'app-join-club',
  standalone: true,
  imports: [FormsModule, IconComponent, AuthShellComponent, HubbyLogoComponent],
  template: `
    <app-auth-shell>
      <div class="brand">
        <app-hubby-logo />
        <div class="brand-name">Hubby</div>
      </div>

      <button type="button" class="back-btn" (click)="back()">
        <app-icon name="chevronLeft" [size]="12" /> Zurück
      </button>

      <h2 class="heading">Verein beitreten</h2>
      <div class="subtitle">Gib den Einladungscode deines Vorstandes ein.</div>

      <form (ngSubmit)="submit()" class="form">
        <div>
          <label class="label">Einladungscode</label>
          <input class="input code-input"
                 placeholder="z.B. FCS-2026-A4XK"
                 [(ngModel)]="code"
                 name="code"
                 autofocus />
        </div>
        <button type="submit" class="btn btn-primary btn-lg submit">
          <span>Beitreten</span> <app-icon name="arrowRight" [size]="14" />
        </button>
      </form>
    </app-auth-shell>
  `,
  styles: [`
    .brand { margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
    .brand-name { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
    .back-btn {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: 0;
      padding: 0;
      cursor: pointer;
    }
    .heading { font-size: 24px; font-weight: 600; margin: 0 0 6px; letter-spacing: -0.02em; }
    .subtitle { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }
    .form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .code-input {
      font-family: monospace;
      letter-spacing: 0.08em;
    }
    .submit {
      justify-content: center;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  `],
})
export class JoinClubComponent {
  state = inject(AppStateService);
  toast = inject(ToastService);

  code = '';

  back(): void {
    this.state.authView.set('create-or-join');
  }

  submit(): void {
    if (this.code.length < 4) {
      this.toast.show({ kind: 'error', body: 'Ungültiger Einladungscode.' });
      return;
    }
    this.toast.show({
      kind: 'success',
      title: 'Beigetreten',
      body: 'Willkommen bei FC Seedorf.',
    });
    this.state.authenticated.set(true);
  }
}
