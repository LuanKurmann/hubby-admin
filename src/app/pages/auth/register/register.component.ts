import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../../core/services/app-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthShellComponent } from '../auth-shell.component';
import { HubbyLogoComponent } from '../hubby-logo.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, IconComponent, AuthShellComponent, HubbyLogoComponent],
  template: `
    <app-auth-shell>
      <div class="brand">
        <app-hubby-logo />
        <div class="brand-name">Hubby</div>
      </div>
      <h2 class="heading">Konto erstellen</h2>
      <div class="subtitle">Kostenlos starten. Keine Kreditkarte nötig.</div>

      <form (ngSubmit)="submit()" class="form">
        <div class="name-grid">
          <div>
            <label class="label">Vorname</label>
            <input class="input" [(ngModel)]="firstName" name="firstName" required />
          </div>
          <div>
            <label class="label">Nachname</label>
            <input class="input" [(ngModel)]="lastName" name="lastName" required />
          </div>
        </div>
        <div>
          <label class="label">E-Mail</label>
          <input class="input" type="email" [(ngModel)]="email" name="email" required />
        </div>
        <div>
          <label class="label">Passwort</label>
          <input class="input" type="password" [(ngModel)]="pw" name="pw" required minlength="8" />
          <div class="hint">Mindestens 8 Zeichen.</div>
        </div>
        <label class="agb-row">
          <input type="checkbox" [(ngModel)]="accept" name="accept" class="agb-cb" />
          <span>Sie akzeptieren die <a class="link">Nutzungsbedingungen</a> und die <a class="link">Datenschutzerklärung</a>.</span>
        </label>
        <button type="submit" class="btn btn-primary btn-lg submit">
          <span>Weiter</span>
          <app-icon name="arrowRight" [size]="14" />
        </button>
      </form>

      <div class="footer">
        Bereits ein Konto?
        <button type="button" class="link-btn primary" (click)="goLogin()">Anmelden</button>
      </div>
    </app-auth-shell>
  `,
  styles: [`
    .brand { margin-bottom: 32px; display: flex; align-items: center; gap: 10px; }
    .brand-name { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
    .heading { font-size: 24px; font-weight: 600; margin: 0 0 6px; letter-spacing: -0.02em; }
    .subtitle { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }
    .form { display: flex; flex-direction: column; gap: 14px; }
    .name-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
    .agb-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
      color: var(--text-secondary);
    }
    .agb-cb { margin-top: 2px; }
    .link { color: var(--primary); font-weight: 500; cursor: pointer; }
    .submit {
      width: 100%;
      justify-content: center;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .footer {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 24px;
      text-align: center;
    }
    .link-btn {
      font-size: 13px;
      color: var(--primary);
      font-weight: 600;
      background: none;
      border: 0;
      cursor: pointer;
      padding: 0;
    }
  `],
})
export class RegisterComponent {
  state = inject(AppStateService);
  toast = inject(ToastService);

  firstName = '';
  lastName = '';
  email = '';
  pw = '';
  accept = false;

  submit(): void {
    if (!this.accept) {
      this.toast.show({ kind: 'error', body: 'Bitte akzeptiere die AGB.' });
      return;
    }
    this.state.user.set({
      name: `${this.firstName} ${this.lastName}`.trim(),
      email: this.email,
    });
    this.state.authView.set('create-or-join');
  }

  goLogin(): void {
    this.state.authView.set('login');
  }
}
