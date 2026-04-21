import { Component } from '@angular/core';
import { HubbyLogoComponent } from './hubby-logo.component';

interface Feature {
  k: string;
  v: string;
}

@Component({
  selector: 'app-auth-hero',
  standalone: true,
  imports: [HubbyLogoComponent],
  template: `
    <div class="auth-hero">
      <svg class="grid-pattern" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="p" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M0 32V0h32" stroke="white" stroke-width="1" fill="none" opacity="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#p)"/>
      </svg>

      <div class="hero-top">
        <app-hubby-logo [inverted]="true" />
        <div class="hero-brand">Hubby</div>
      </div>

      <div class="hero-middle">
        <div class="hero-eyebrow">Vereinsmanagement, neu gedacht.</div>
        <h1 class="hero-headline">
          Alles für deinen Verein.<br/>An einem Ort.
        </h1>

        <div class="hero-features">
          @for (f of features; track f.k) {
            <div class="feature-card">
              <div class="feature-k">{{ f.k }}</div>
              <div class="feature-v">{{ f.v }}</div>
            </div>
          }
        </div>
      </div>

      <div class="hero-footer">
        Entwickelt in der Schweiz · für Schweizer Vereine
      </div>
    </div>
  `,
  styles: [`
    .auth-hero {
      position: relative;
      background: linear-gradient(135deg, #7F1D1D 0%, #DC2626 55%, #EF4444 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px;
      color: #fff;
      overflow: hidden;
      min-height: 100vh;
    }
    .grid-pattern {
      position: absolute;
      inset: 0;
      opacity: 0.14;
      width: 100%;
      height: 100%;
    }
    .hero-top {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .hero-brand {
      font-weight: 700;
      font-size: 20px;
      letter-spacing: -0.02em;
    }
    .hero-middle {
      position: relative;
    }
    .hero-eyebrow {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.75;
      margin-bottom: 10px;
    }
    .hero-headline {
      font-size: 44px;
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.03em;
      margin: 0;
      max-width: 460px;
    }
    .hero-features {
      display: flex;
      gap: 12px;
      margin-top: 28px;
      flex-wrap: wrap;
    }
    .feature-card {
      padding: 10px 14px;
      background: rgba(255,255,255,0.14);
      backdrop-filter: blur(8px);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.25);
      min-width: 140px;
    }
    .feature-k {
      font-size: 11px;
      opacity: 0.78;
    }
    .feature-v {
      font-size: 13px;
      font-weight: 600;
    }
    .hero-footer {
      position: relative;
      font-size: 12px;
      opacity: 0.75;
    }
  `],
})
export class AuthHeroComponent {
  features: Feature[] = [
    { k: 'Mitglieder', v: 'Einfach verwaltet' },
    { k: 'Events', v: 'An-/Abmeldung in Echtzeit' },
    { k: 'Beiträge', v: 'Ohne Excel-Chaos' },
  ];
}
