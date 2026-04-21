import { Component } from '@angular/core';
import { AuthHeroComponent } from './auth-hero.component';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [AuthHeroComponent],
  template: `
    <div class="auth-shell">
      <div class="auth-pane">
        <div class="auth-content">
          <ng-content></ng-content>
        </div>
      </div>
      <app-auth-hero />
    </div>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      background: var(--bg);
    }
    .auth-pane {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
    }
    .auth-content {
      width: 100%;
      max-width: 400px;
    }
    @media (max-width: 900px) {
      .auth-shell {
        grid-template-columns: 1fr;
      }
      :host ::ng-deep app-auth-hero { display: none; }
    }
  `],
})
export class AuthShellComponent {}
