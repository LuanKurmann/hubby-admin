import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../../core/services/app-state.service';
import { MockDataService } from '../../../core/services/mock-data.service';
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
      <div class="subtitle">Gib den Einladungscode ein, den du vom Vorstand erhalten hast.</div>

      <form (ngSubmit)="submit()" class="form" autocomplete="off">
        <div>
          <label class="label">Einladungscode</label>
          <input class="input code-input"
                 placeholder="z.B. FCS-2026-A4XK"
                 [ngModel]="code()"
                 (ngModelChange)="onCodeChange($event)"
                 name="code"
                 autofocus
                 autocomplete="off" />
          @if (validationState() === 'valid' && matchedCode(); as m) {
            <div class="hint ok">
              <app-icon name="checkCircle" [size]="12" />
              Gültig — {{ m.roleIds.length > 1 ? 'Rollen' : 'Rolle' }} <strong>{{ roleNames() }}</strong>
              @if (m.teamId) { im Team <strong>{{ teamName() }}</strong> }
            </div>
          } @else if (validationState() === 'expired') {
            <div class="hint err"><app-icon name="alert" [size]="12" /> Code ist abgelaufen.</div>
          } @else if (validationState() === 'exhausted') {
            <div class="hint err"><app-icon name="alert" [size]="12" /> Code wurde bereits voll ausgeschöpft.</div>
          } @else if (validationState() === 'revoked') {
            <div class="hint err"><app-icon name="alert" [size]="12" /> Code wurde widerrufen.</div>
          } @else if (validationState() === 'invalid' && code().length > 3) {
            <div class="hint err"><app-icon name="alert" [size]="12" /> Code nicht gefunden.</div>
          } @else {
            <div class="hint neutral">Erhältlich beim Vereinspräsidium oder -trainer.</div>
          }
        </div>
        <button type="submit" class="btn btn-primary btn-lg submit" [disabled]="validationState() !== 'valid'">
          <span>Beitreten</span> <app-icon name="arrowRight" [size]="14" />
        </button>
      </form>

      <div class="demo-hint">
        <div class="demo-label">Zum Ausprobieren:</div>
        @for (c of demoCodes(); track c.id) {
          <button type="button" class="demo-chip" (click)="code.set(c.code); onCodeChange(c.code)">
            {{ c.code }}
          </button>
        }
      </div>
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
    .form { display: flex; flex-direction: column; gap: 14px; }
    .code-input { font-family: ui-monospace,SFMono-Regular,monospace; letter-spacing: 0.08em; text-transform: uppercase; }
    .submit { justify-content: center; display: inline-flex; align-items: center; gap: 6px; }
    .submit:disabled { opacity: 0.55; cursor: not-allowed; }
    .hint { margin-top: 6px; font-size: 12px; display: flex; align-items: center; gap: 5px; line-height: 1.4; }
    .hint.ok { color: var(--success); }
    .hint.err { color: var(--danger); }
    .hint.neutral { color: var(--text-muted); }
    .demo-hint {
      margin-top: 32px;
      padding: 14px;
      background: var(--bg-subtle);
      border-radius: 10px;
      font-size: 12px;
    }
    .demo-label { color: var(--text-muted); margin-bottom: 8px; }
    .demo-chip {
      display: inline-block;
      margin: 3px 3px 0 0;
      padding: 4px 10px;
      border-radius: 6px;
      background: var(--bg-elev);
      border: 1px solid var(--border);
      font-family: ui-monospace,SFMono-Regular,monospace;
      font-size: 11px;
      color: var(--text);
      cursor: pointer;
    }
    .demo-chip:hover { background: var(--bg-hover); }
  `],
})
export class JoinClubComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  code = signal<string>('');

  onCodeChange(v: string): void {
    this.code.set(v.toUpperCase());
  }

  matchedCode = computed(() => {
    const c = this.code().trim();
    if (c.length < 4) return null;
    return this.data.inviteCodes().find(x => x.code.toUpperCase() === c) ?? null;
  });

  validationState = computed<'empty' | 'invalid' | 'expired' | 'exhausted' | 'revoked' | 'valid'>(() => {
    const c = this.code().trim();
    if (c.length < 4) return 'empty';
    const m = this.matchedCode();
    if (!m) return 'invalid';
    if (m.status === 'revoked') return 'revoked';
    if (m.expiresAt && m.expiresAt.getTime() < Date.now()) return 'expired';
    if (m.maxUses !== null && m.usedCount >= m.maxUses) return 'exhausted';
    return 'valid';
  });

  roleNames = computed(() => {
    const m = this.matchedCode();
    if (!m) return '';
    return m.roleIds.map(id => this.data.getRole(id)?.name).filter(Boolean).join(', ');
  });

  teamName = computed(() => {
    const m = this.matchedCode();
    return m?.teamId ? (this.data.getTeam(m.teamId)?.name ?? '') : '';
  });

  demoCodes = computed(() =>
    this.data.inviteCodes().filter(c => c.status === 'active' && (c.maxUses === null || c.usedCount < c.maxUses)).slice(0, 3)
  );

  back(): void {
    this.state.authView.set('create-or-join');
  }

  submit(): void {
    if (this.validationState() !== 'valid') return;
    const m = this.matchedCode();
    if (!m) return;
    this.data.updateInviteCode(m.id, { usedCount: m.usedCount + 1 });
    this.toast.show({
      kind: 'success',
      title: 'Beigetreten',
      body: `Willkommen! Du bist jetzt als ${this.roleNames()} registriert.`,
    });
    this.state.authenticated.set(true);
  }
}
