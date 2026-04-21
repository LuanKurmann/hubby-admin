import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../../core/services/app-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthShellComponent } from '../auth-shell.component';
import { HubbyLogoComponent } from '../hubby-logo.component';

@Component({
  selector: 'app-create-club',
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

      <h2 class="heading">Neuen Verein anlegen</h2>
      <div class="subtitle">Schritt {{ step() }} von 3</div>

      <div class="progress">
        @for (s of [1, 2, 3]; track s) {
          <div class="progress-seg" [class.active]="s <= step()"></div>
        }
      </div>

      @if (step() === 1) {
        <div class="form">
          <div>
            <label class="label">Vereinsname</label>
            <input class="input" placeholder="z.B. FC Seedorf" [(ngModel)]="name" name="name" autofocus />
          </div>
          <div>
            <label class="label">Sportart</label>
            <select class="select" [(ngModel)]="sport" name="sport">
              <option>Fussball</option>
              <option>Turnen</option>
              <option>Unihockey</option>
              <option>Handball</option>
              <option>Volleyball</option>
              <option>Leichtathletik</option>
              <option>Andere</option>
            </select>
          </div>
          <div>
            <label class="label">Ort</label>
            <input class="input" placeholder="z.B. Seedorf UR" [(ngModel)]="city" name="city" />
          </div>
          <button class="btn btn-primary btn-lg submit" [disabled]="!name" (click)="step.set(2)">
            <span>Weiter</span> <app-icon name="arrowRight" [size]="14" />
          </button>
        </div>
      }

      @if (step() === 2) {
        <div class="form">
          <div>
            <label class="label">Wie viele Mitglieder hat euer Verein?</label>
            <div class="member-grid">
              @for (o of memberOptions; track o) {
                <button type="button"
                        class="member-btn"
                        [class.active]="members === o"
                        (click)="members = o">
                  {{ o }}
                </button>
              }
            </div>
          </div>
          <div>
            <label class="label">Sprache</label>
            <select class="select" [(ngModel)]="language" name="language">
              <option value="DE">Deutsch</option>
              <option value="FR">Français</option>
              <option value="IT">Italiano</option>
            </select>
          </div>
          <div class="row-btns">
            <button class="btn btn-lg" (click)="step.set(1)">Zurück</button>
            <button class="btn btn-primary btn-lg" (click)="step.set(3)">
              <span>Weiter</span> <app-icon name="arrowRight" [size]="14" />
            </button>
          </div>
        </div>
      }

      @if (step() === 3) {
        <div class="form">
          <div class="preview-card">
            <div class="preview-head">
              <div class="club-badge">{{ initials() }}</div>
              <div>
                <div class="club-name">{{ name || 'Dein Verein' }}</div>
                <div class="club-meta">{{ sport }} · {{ city || 'Ort' }}</div>
              </div>
            </div>
            <div class="preview-body">
              Alles startklar! Wir erstellen deinen Verein mit Standard-Rollen (Präsident, Kassier, Trainer, Aktivmitglied) und einer Basis-Struktur. Du kannst alles jederzeit in den Einstellungen anpassen.
            </div>
          </div>
          <div class="row-btns">
            <button class="btn btn-lg flex1" (click)="step.set(2)">Zurück</button>
            <button class="btn btn-primary btn-lg flex2" (click)="finish()">
              <span>Verein erstellen</span> <app-icon name="check" [size]="14" />
            </button>
          </div>
        </div>
      }
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
    .progress {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
    }
    .progress-seg {
      flex: 1;
      height: 3px;
      border-radius: 2px;
      background: var(--border);
      transition: background .2s;
    }
    .progress-seg.active {
      background: var(--primary);
    }
    .form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .member-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .member-btn {
      padding: 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-elev);
      color: var(--text);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .member-btn.active {
      border-color: var(--primary);
      background: var(--primary-subtle);
      color: var(--primary);
    }
    .submit {
      justify-content: center;
      margin-top: 8px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .row-btns {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    .row-btns .btn {
      flex: 1;
      justify-content: center;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .flex1 { flex: 1 !important; }
    .flex2 { flex: 2 !important; }
    .preview-card {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg-elev);
    }
    .preview-head {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }
    .club-badge {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: var(--primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
    }
    .club-name { font-size: 15px; font-weight: 600; }
    .club-meta { font-size: 12px; color: var(--text-muted); }
    .preview-body {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.6;
    }
  `],
})
export class CreateClubComponent {
  state = inject(AppStateService);
  toast = inject(ToastService);

  step = signal<number>(1);
  name = '';
  sport = 'Fussball';
  city = '';
  members = '21-50';
  language = 'DE';

  memberOptions = ['<20', '21-50', '51-100', '>100'];

  initials = computed(() => {
    const parts = this.name.split(' ').filter(Boolean);
    const init = parts.map(p => p[0]).slice(0, 3).join('').toUpperCase();
    return init || '?';
  });

  back(): void {
    this.state.authView.set('create-or-join');
  }

  finish(): void {
    this.toast.show({
      kind: 'success',
      title: 'Verein erstellt',
      body: `${this.name} ist bereit. Lade jetzt die ersten Mitglieder ein.`,
    });
    this.state.authenticated.set(true);
  }
}
