import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../../core/services/app-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthShellComponent } from '../auth-shell.component';
import { HubbyLogoComponent } from '../hubby-logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IconComponent, AuthShellComponent, HubbyLogoComponent],
  template: `
    <app-auth-shell>
      <div class="brand">
        <app-hubby-logo />
        <div class="brand-name">Hubby</div>
      </div>
      <h2 class="heading">Anmelden</h2>
      <div class="subtitle">Willkommen zurück. Melde dich mit deinem Konto an.</div>

      <form (ngSubmit)="submit()" class="form">
        <div>
          <label class="label">E-Mail</label>
          <input class="input" type="email" [(ngModel)]="email" name="email" required autofocus />
        </div>
        <div>
          <div class="label-row">
            <label class="label" style="margin:0">Passwort</label>
            <button type="button" class="link-btn">Passwort vergessen?</button>
          </div>
          <input class="input" type="password" [(ngModel)]="pw" name="pw" required />
        </div>
        <label class="check-row">
          <input type="checkbox" [(ngModel)]="stayLoggedIn" name="stayLoggedIn" />
          Angemeldet bleiben
        </label>
        <button type="submit" class="btn btn-primary btn-lg submit" [disabled]="busy()">
          @if (busy()) {
            <span>Wird angemeldet …</span>
          } @else {
            <span>Anmelden</span>
            <app-icon name="arrowRight" [size]="14" />
          }
        </button>
      </form>

      <div class="divider">
        <div class="line"></div>
        <div class="or">oder</div>
        <div class="line"></div>
      </div>

      <div class="social">
        <button class="btn social-btn" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.09A6.63 6.63 0 0 1 5.48 12c0-.73.13-1.43.36-2.09V7.07H2.18a10.99 10.99 0 0 0 0 9.86l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A10.99 10.99 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/></svg>
          Google
        </button>
        <button class="btn social-btn" type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09Z"/><path d="M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z"/></svg>
          Apple
        </button>
      </div>

      <div class="footer">
        Noch kein Konto?
        <button type="button" class="link-btn primary" (click)="goRegister()">Jetzt registrieren</button>
      </div>
    </app-auth-shell>
  `,
  styles: [`
    .brand {
      margin-bottom: 32px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-name {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .heading {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 6px;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 24px;
    }
    .form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .link-btn {
      font-size: 12px;
      color: var(--primary);
      font-weight: 500;
      background: none;
      border: 0;
      cursor: pointer;
      padding: 0;
    }
    .link-btn.primary {
      font-weight: 600;
    }
    .check-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-secondary);
    }
    .submit {
      width: 100%;
      justify-content: center;
      margin-top: 4px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 20px 0;
    }
    .line {
      flex: 1;
      height: 1px;
      background: var(--border);
    }
    .or {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .social {
      display: flex;
      gap: 8px;
    }
    .social-btn {
      flex: 1;
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
  `],
})
export class LoginComponent {
  state = inject(AppStateService);
  toast = inject(ToastService);

  email = 'admin@fc-seedorf.ch';
  pw = 'demo12345';
  stayLoggedIn = true;
  busy = signal<boolean>(false);

  submit(): void {
    this.busy.set(true);
    setTimeout(() => {
      this.busy.set(false);
      this.state.authenticated.set(true);
      this.toast.show({ kind: 'success', title: 'Willkommen zurück', body: 'Du bist bei FC Seedorf angemeldet.' });
    }, 700);
  }

  goRegister(): void {
    this.state.authView.set('register');
  }
}
