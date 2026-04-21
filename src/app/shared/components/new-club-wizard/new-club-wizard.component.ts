import { Component, inject, signal, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService } from '../../../core/services/app-state.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';
import { HubbyLogoComponent } from '../../../pages/auth/hubby-logo.component';

type StepId = 'basics' | 'location' | 'branding' | 'teams' | 'board' | 'defaults' | 'finish';

interface StepDef {
  id: StepId;
  label: string;
  icon: string;
  hint: string;
}

interface TeamDraft {
  id: number;
  name: string;
  category: string;
  short: string;
  color: string;
}

interface BoardDraft {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const STEPS: StepDef[] = [
  { id: 'basics', label: 'Grunddaten', icon: 'building', hint: 'Vereinsname, Sportart und Gründungsjahr' },
  { id: 'location', label: 'Standort', icon: 'mapPin', hint: 'Adresse und Kontaktdaten' },
  { id: 'branding', label: 'Branding', icon: 'sparkles', hint: 'Farbe und Logo' },
  { id: 'teams', label: 'Teams', icon: 'ball', hint: 'Erste Mannschaften anlegen' },
  { id: 'board', label: 'Vorstand', icon: 'users', hint: 'Vorstandsmitglieder einladen' },
  { id: 'defaults', label: 'Standards', icon: 'settings', hint: 'Beiträge und Sprache' },
  { id: 'finish', label: 'Fertig', icon: 'checkCircle', hint: 'Alles bereit' },
];

const TEAM_PRESETS = [
  { name: '1. Mannschaft', category: 'Aktive', short: '1.M', color: '#DC2626' },
  { name: '2. Mannschaft', category: 'Aktive', short: '2.M', color: '#EA580C' },
  { name: 'Senioren 30+', category: 'Senioren', short: 'S30', color: '#7C3AED' },
  { name: 'Junioren U17', category: 'Junioren', short: 'U17', color: '#2563EB' },
  { name: 'Junioren U15', category: 'Junioren', short: 'U15', color: '#0891B2' },
  { name: 'Junioren U13', category: 'Junioren', short: 'U13', color: '#059669' },
  { name: 'Damen FF1', category: 'Damen', short: 'FF1', color: '#DB2777' },
];

const BOARD_ROLE_PRESETS = ['Präsident', 'Vize-Präsident', 'Kassier', 'Aktuar', 'Trainer', 'Materialwart', 'Beisitzer'];

const COLOR_PRESETS = ['#DC2626', '#EA580C', '#F59E0B', '#059669', '#0891B2', '#2563EB', '#7C3AED', '#DB2777', '#0F172A'];

const SPORTS = ['Fussball', 'Turnen', 'Unihockey', 'Handball', 'Volleyball', 'Basketball', 'Eishockey', 'Leichtathletik', 'Tennis', 'Schwimmen', 'Andere'];

const CANTONS = ['AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH'];

@Component({
  selector: 'app-new-club-wizard',
  standalone: true,
  imports: [FormsModule, IconComponent, HubbyLogoComponent],
  template: `
    <div class="wizard-root">
      <!-- Top bar -->
      <header class="wz-header">
        <div class="wz-brand">
          <app-hubby-logo [size]="32" />
          <div class="wz-brand-text">
            <div class="wz-brand-title">Neuen Verein anlegen</div>
            <div class="wz-brand-sub">{{ currentStep().hint }}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-icon" (click)="onClose()" [title]="inAuthFlow() ? 'Zurück' : 'Schliessen'">
          <app-icon name="x" [size]="18" />
        </button>
      </header>

      <div class="wz-body">
        <!-- Stepper sidebar -->
        <aside class="wz-sidebar">
          <div class="wz-steps">
            @for (s of steps; track s.id; let i = $index) {
              <button class="wz-step"
                [class.current]="s.id === currentStepId()"
                [class.done]="i < stepIdx()"
                [class.upcoming]="i > stepIdx()"
                [disabled]="i > stepIdx() && !canJumpTo(i)"
                (click)="jumpTo(i)">
                <div class="wz-step-dot">
                  @if (i < stepIdx()) {
                    <app-icon name="check" [size]="12" />
                  } @else {
                    <span>{{ i + 1 }}</span>
                  }
                </div>
                <div class="wz-step-label">
                  <div class="wz-step-title">{{ s.label }}</div>
                  <div class="wz-step-hint">{{ s.hint }}</div>
                </div>
              </button>
            }
          </div>
          <div class="wz-progress">
            <div class="wz-progress-track">
              <div class="wz-progress-fill" [style.width]="progressPct() + '%'"></div>
            </div>
            <div class="wz-progress-text">{{ stepIdx() + 1 }} / {{ steps.length }}</div>
          </div>
        </aside>

        <!-- Step content -->
        <section class="wz-main">
          <div class="wz-content">
            @switch (currentStepId()) {
              @case ('basics') {
                <h2 class="wz-h2">Erzähl uns von deinem Verein</h2>
                <p class="wz-p">Diese Angaben kannst du jederzeit in den Einstellungen anpassen.</p>
                <div class="wz-grid">
                  <div class="wz-field wz-col-2">
                    <label class="label">Vereinsname <span class="req">*</span></label>
                    <input class="input" placeholder="z.B. FC Seedorf" [(ngModel)]="form.name" name="name" autofocus>
                  </div>
                  <div class="wz-field">
                    <label class="label">Sportart</label>
                    <select class="select" [(ngModel)]="form.sport" name="sport">
                      @for (s of sports; track s) { <option>{{ s }}</option> }
                    </select>
                  </div>
                  <div class="wz-field">
                    <label class="label">Gründungsjahr</label>
                    <input class="input" type="number" min="1850" max="2026" placeholder="1985" [(ngModel)]="form.foundedYear" name="foundedYear">
                  </div>
                  <div class="wz-field wz-col-2">
                    <label class="label">Kurzbeschreibung (optional)</label>
                    <textarea class="textarea" rows="3" placeholder="z.B. Traditionsverein aus dem Kanton Uri, gegründet 1985."
                      [(ngModel)]="form.description" name="description"></textarea>
                  </div>
                </div>
              }

              @case ('location') {
                <h2 class="wz-h2">Wo seid ihr zu Hause?</h2>
                <p class="wz-p">Standort und Kontakt für externe Kommunikation.</p>
                <div class="wz-grid">
                  <div class="wz-field wz-col-2">
                    <label class="label">Strasse und Nr.</label>
                    <input class="input" placeholder="Dorfstrasse 12" [(ngModel)]="form.street" name="street">
                  </div>
                  <div class="wz-field">
                    <label class="label">PLZ</label>
                    <input class="input" placeholder="6462" [(ngModel)]="form.zip" name="zip">
                  </div>
                  <div class="wz-field">
                    <label class="label">Ort</label>
                    <input class="input" placeholder="Seedorf" [(ngModel)]="form.city" name="city">
                  </div>
                  <div class="wz-field">
                    <label class="label">Kanton</label>
                    <select class="select" [(ngModel)]="form.canton" name="canton">
                      @for (c of cantons; track c) { <option>{{ c }}</option> }
                    </select>
                  </div>
                  <div class="wz-field">
                    <label class="label">Website</label>
                    <input class="input" placeholder="https://fc-seedorf.ch" [(ngModel)]="form.website" name="website">
                  </div>
                  <div class="wz-field">
                    <label class="label">Kontakt E-Mail</label>
                    <input class="input" type="email" placeholder="info@fc-seedorf.ch" [(ngModel)]="form.email" name="email">
                  </div>
                  <div class="wz-field">
                    <label class="label">Telefon (optional)</label>
                    <input class="input" placeholder="+41 41 870 00 00" [(ngModel)]="form.phone" name="phone">
                  </div>
                </div>
              }

              @case ('branding') {
                <h2 class="wz-h2">Wie soll dein Verein aussehen?</h2>
                <p class="wz-p">Farbe und Logo sorgen für Wiedererkennung in der App.</p>
                <div class="wz-field">
                  <label class="label">Primärfarbe</label>
                  <div class="wz-colors">
                    @for (c of colors; track c) {
                      <button type="button" class="wz-color"
                        [style.background]="c"
                        [class.active]="form.color === c"
                        (click)="form.color = c"
                        [attr.aria-label]="c">
                        @if (form.color === c) { <app-icon name="check" [size]="14" /> }
                      </button>
                    }
                    <div class="wz-color-custom">
                      <span>Benutzerdefiniert</span>
                      <input type="color" [(ngModel)]="form.color" name="color">
                    </div>
                  </div>
                </div>

                <div class="wz-field" style="margin-top:24px">
                  <label class="label">Logo-Vorschau</label>
                  <div class="wz-logo-preview">
                    <div class="wz-logo-box" [style.background]="form.color">{{ initials() }}</div>
                    <div>
                      <div class="wz-preview-name">{{ form.name || 'Dein Verein' }}</div>
                      <div class="wz-preview-sub">{{ form.sport }} · {{ form.city || 'Ort' }}</div>
                      <div class="wz-preview-note">
                        Logo-Initialen werden automatisch aus dem Vereinsnamen generiert.
                        Eigenes Logo lässt sich später hochladen.
                      </div>
                    </div>
                  </div>
                </div>
              }

              @case ('teams') {
                <h2 class="wz-h2">Welche Teams habt ihr?</h2>
                <p class="wz-p">
                  Lege die ersten Mannschaften an — du kannst später jederzeit weitere hinzufügen.
                  <button type="button" class="wz-link" (click)="skipTeams()">Überspringen</button>
                </p>

                @if (teams().length === 0) {
                  <div class="wz-empty">
                    <app-icon name="ball" [size]="32" />
                    <div>Noch keine Teams — wähle unten aus Presets oder erstelle eines von Hand.</div>
                  </div>
                }

                @if (teams().length > 0) {
                  <div class="wz-team-list">
                    @for (t of teams(); track t.id) {
                      <div class="wz-team-row">
                        <div class="wz-team-short" [style.background]="t.color">{{ t.short }}</div>
                        <input class="input" placeholder="Team-Name" [(ngModel)]="t.name" [name]="'tn' + t.id">
                        <input class="input" placeholder="Kat." [(ngModel)]="t.category" [name]="'tc' + t.id" style="width:120px">
                        <button type="button" class="btn btn-ghost btn-icon" (click)="removeTeam(t.id)">
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    }
                  </div>
                }

                <div class="wz-presets">
                  <div class="wz-presets-label">Schnell hinzufügen:</div>
                  <div class="wz-presets-chips">
                    @for (p of teamPresets; track p.name) {
                      @if (!hasTeamName(p.name)) {
                        <button type="button" class="wz-chip" (click)="addPresetTeam(p)">
                          <span class="wz-chip-dot" [style.background]="p.color"></span>
                          <app-icon name="plus" [size]="10" /> {{ p.name }}
                        </button>
                      }
                    }
                    <button type="button" class="wz-chip wz-chip-custom" (click)="addCustomTeam()">
                      <app-icon name="plus" [size]="10" /> Eigenes Team
                    </button>
                  </div>
                </div>
              }

              @case ('board') {
                <h2 class="wz-h2">Wer bildet den Vorstand?</h2>
                <p class="wz-p">
                  Vorstandsmitglieder erhalten eine E-Mail-Einladung zum Beitritt.
                  <button type="button" class="wz-link" (click)="skipBoard()">Überspringen</button>
                </p>

                @if (board().length === 0) {
                  <div class="wz-empty">
                    <app-icon name="userPlus" [size]="32" />
                    <div>Noch keine Vorstandsmitglieder — füge welche hinzu oder überspringe diesen Schritt.</div>
                  </div>
                }

                @if (board().length > 0) {
                  <div class="wz-board-list">
                    @for (b of board(); track b.id) {
                      <div class="wz-board-row">
                        <input class="input" placeholder="Vorname" [(ngModel)]="b.firstName" [name]="'bfn' + b.id" style="width:140px">
                        <input class="input" placeholder="Nachname" [(ngModel)]="b.lastName" [name]="'bln' + b.id" style="width:160px">
                        <input class="input" placeholder="E-Mail" [(ngModel)]="b.email" [name]="'bem' + b.id" type="email">
                        <select class="select" [(ngModel)]="b.role" [name]="'br' + b.id" style="width:160px">
                          @for (r of boardRoles; track r) { <option>{{ r }}</option> }
                        </select>
                        <button type="button" class="btn btn-ghost btn-icon" (click)="removeBoard(b.id)">
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    }
                  </div>
                }

                <button type="button" class="btn" (click)="addBoard()" style="margin-top:12px">
                  <app-icon name="userPlus" [size]="13" /> Vorstandsmitglied hinzufügen
                </button>
              }

              @case ('defaults') {
                <h2 class="wz-h2">Standardwerte & Sprache</h2>
                <p class="wz-p">Diese Einstellungen werden als Startwerte verwendet.</p>
                <div class="wz-grid">
                  <div class="wz-field">
                    <label class="label">Standard-Jahresbeitrag (CHF)</label>
                    <input class="input" type="number" min="0" [(ngModel)]="form.defaultDue" name="defaultDue">
                  </div>
                  <div class="wz-field">
                    <label class="label">Fälligkeitsdatum</label>
                    <input class="input" type="date" [(ngModel)]="form.dueDate" name="dueDate">
                  </div>
                  <div class="wz-field">
                    <label class="label">Sprache</label>
                    <select class="select" [(ngModel)]="form.language" name="language">
                      <option value="DE">Deutsch</option>
                      <option value="FR">Français</option>
                      <option value="IT">Italiano</option>
                    </select>
                  </div>
                  <div class="wz-field">
                    <label class="label">Vereinsgrösse</label>
                    <select class="select" [(ngModel)]="form.memberRange" name="memberRange">
                      <option>Unter 20</option>
                      <option>21 – 50</option>
                      <option>51 – 100</option>
                      <option>101 – 250</option>
                      <option>Über 250</option>
                    </select>
                  </div>
                </div>
              }

              @case ('finish') {
                <h2 class="wz-h2">🎉 Alles bereit!</h2>
                <p class="wz-p">Prüfe nochmal kurz deine Angaben und klicke auf "Verein erstellen".</p>

                <div class="wz-review">
                  <div class="wz-review-hero">
                    <div class="wz-logo-box-lg" [style.background]="form.color">{{ initials() }}</div>
                    <div>
                      <div class="wz-review-name">{{ form.name || 'Dein Verein' }}</div>
                      <div class="wz-review-sub">
                        {{ form.sport }}
                        @if (form.city) { · {{ form.city }} }
                        @if (form.foundedYear) { · gegr. {{ form.foundedYear }} }
                      </div>
                    </div>
                  </div>

                  <div class="wz-review-grid">
                    <div class="wz-review-stat">
                      <div class="wz-review-stat-label">Teams</div>
                      <div class="wz-review-stat-val">{{ teams().length }}</div>
                    </div>
                    <div class="wz-review-stat">
                      <div class="wz-review-stat-label">Vorstand</div>
                      <div class="wz-review-stat-val">{{ board().length }}</div>
                    </div>
                    <div class="wz-review-stat">
                      <div class="wz-review-stat-label">Jahresbeitrag</div>
                      <div class="wz-review-stat-val">CHF {{ form.defaultDue }}</div>
                    </div>
                    <div class="wz-review-stat">
                      <div class="wz-review-stat-label">Sprache</div>
                      <div class="wz-review-stat-val">{{ form.language }}</div>
                    </div>
                  </div>

                  @if (teams().length > 0) {
                    <div class="wz-review-section">
                      <div class="wz-review-section-title">Teams</div>
                      <div class="wz-review-chips">
                        @for (t of teams(); track t.id) {
                          <span class="wz-review-chip" [style.background]="t.color + '22'" [style.color]="t.color">
                            {{ t.name }}
                          </span>
                        }
                      </div>
                    </div>
                  }

                  @if (board().length > 0) {
                    <div class="wz-review-section">
                      <div class="wz-review-section-title">Vorstandsmitglieder ({{ board().length }} Einladungen)</div>
                      <div class="wz-review-list">
                        @for (b of board(); track b.id) {
                          <div class="wz-review-board">
                            <span>{{ b.firstName }} {{ b.lastName }}</span>
                            <span class="chip">{{ b.role }}</span>
                            <span class="wz-mail">{{ b.email }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </div>

          <footer class="wz-footer">
            <div class="wz-footer-left">
              @if (stepIdx() > 0) {
                <button class="btn btn-lg" (click)="prev()">
                  <app-icon name="chevronLeft" [size]="14" /> Zurück
                </button>
              }
            </div>
            <div class="wz-footer-right">
              @if (currentStepId() === 'finish') {
                <button class="btn btn-primary btn-lg" [disabled]="!canFinish()" (click)="finish()">
                  <app-icon name="check" [size]="14" /> Verein erstellen
                </button>
              } @else {
                @if (currentStepId() === 'teams' || currentStepId() === 'board') {
                  <button class="btn btn-ghost btn-lg" (click)="next()">Später erledigen</button>
                }
                <button class="btn btn-primary btn-lg" [disabled]="!canAdvance()" (click)="next()">
                  Weiter <app-icon name="arrowRight" [size]="14" />
                </button>
              }
            </div>
          </footer>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .wizard-root {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      animation: fadeIn .2s ease-out;
    }
    .wz-header {
      height: 60px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-elev);
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
    }
    .wz-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .wz-brand-text { min-width: 0; }
    .wz-brand-title { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
    .wz-brand-sub { font-size: 12px; color: var(--text-muted); margin-top: 1px; }

    .wz-body { flex: 1; display: flex; min-height: 0; overflow: hidden; }

    .wz-sidebar {
      width: 280px;
      border-right: 1px solid var(--border);
      background: var(--bg-subtle);
      padding: 20px 14px;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      overflow-y: auto;
    }
    .wz-steps { display: flex; flex-direction: column; gap: 2px; flex: 1; }

    .wz-step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      background: transparent;
      color: var(--text-secondary);
      text-align: left;
      transition: background .12s;
      cursor: pointer;
    }
    .wz-step:disabled { cursor: not-allowed; opacity: 0.55; }
    .wz-step:not(:disabled):hover { background: var(--bg-hover); }
    .wz-step.current { background: var(--primary-subtle); color: var(--primary); }
    .wz-step.done { color: var(--text); }

    .wz-step-dot {
      width: 24px; height: 24px; border-radius: 50%;
      background: var(--bg-elev);
      border: 1.5px solid var(--border);
      color: var(--text-muted);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 600;
      flex-shrink: 0; margin-top: 1px;
    }
    .wz-step.current .wz-step-dot {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
    }
    .wz-step.done .wz-step-dot {
      background: var(--success);
      border-color: var(--success);
      color: #fff;
    }
    .wz-step-label { flex: 1; min-width: 0; }
    .wz-step-title { font-size: 13px; font-weight: 500; }
    .wz-step-hint { font-size: 11px; opacity: 0.75; margin-top: 2px; line-height: 1.3; }

    .wz-progress { padding-top: 16px; border-top: 1px solid var(--border); margin-top: 16px; }
    .wz-progress-track { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
    .wz-progress-fill { height: 100%; background: var(--primary); transition: width .25s; }
    .wz-progress-text { font-size: 11px; color: var(--text-muted); margin-top: 6px; text-align: right; }

    .wz-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .wz-content { flex: 1; overflow-y: auto; padding: 32px 40px; max-width: 840px; width: 100%; }

    .wz-h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 4px; }
    .wz-p { font-size: 14px; color: var(--text-muted); margin: 0 0 28px; line-height: 1.55; }
    .wz-link {
      background: none; border: 0; padding: 0; color: var(--primary); font-weight: 500;
      font-size: 13px; text-decoration: underline; cursor: pointer; margin-left: 6px;
    }

    .wz-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .wz-field { display: flex; flex-direction: column; }
    .wz-col-2 { grid-column: span 2; }
    .req { color: var(--danger); margin-left: 2px; }

    .wz-colors {
      display: flex; gap: 10px; flex-wrap: wrap;
      padding: 14px; background: var(--bg-subtle); border-radius: 10px;
    }
    .wz-color {
      width: 40px; height: 40px; border-radius: 10px;
      border: 2px solid transparent;
      box-shadow: 0 0 0 1px var(--border);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    .wz-color.active { border-color: var(--text); box-shadow: 0 0 0 3px var(--primary-subtle); }
    .wz-color-custom {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      font-size: 11px; color: var(--text-muted);
    }
    .wz-color-custom input[type=color] {
      width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--border);
      background: none; cursor: pointer; padding: 2px;
    }

    .wz-logo-preview {
      display: flex; gap: 14px; align-items: center;
      padding: 16px; border: 1px solid var(--border); border-radius: 10px;
      background: var(--bg-elev);
    }
    .wz-logo-box {
      width: 52px; height: 52px; border-radius: 12px; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700; letter-spacing: -0.02em;
      flex-shrink: 0;
    }
    .wz-logo-box-lg {
      width: 64px; height: 64px; border-radius: 14px; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; letter-spacing: -0.02em;
      flex-shrink: 0;
    }
    .wz-preview-name { font-size: 15px; font-weight: 600; }
    .wz-preview-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .wz-preview-note { font-size: 11px; color: var(--text-muted); margin-top: 8px; line-height: 1.5; max-width: 400px; }

    .wz-empty {
      padding: 32px;
      border: 1px dashed var(--border);
      border-radius: 12px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }

    .wz-team-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .wz-team-row {
      display: flex; align-items: center; gap: 8px;
      padding: 6px; border: 1px solid var(--border); border-radius: 8px;
      background: var(--bg-elev);
    }
    .wz-team-short {
      width: 32px; height: 32px; border-radius: 7px; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; flex-shrink: 0;
    }

    .wz-presets { margin-top: 12px; }
    .wz-presets-label { font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
    .wz-presets-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .wz-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 10px; border-radius: 999px;
      background: var(--bg-elev); border: 1px solid var(--border);
      font-size: 12px; color: var(--text); cursor: pointer;
    }
    .wz-chip:hover { background: var(--bg-hover); }
    .wz-chip-dot { width: 8px; height: 8px; border-radius: 50%; }
    .wz-chip-custom { color: var(--primary); border-color: var(--primary-subtle-border); }

    .wz-board-list { display: flex; flex-direction: column; gap: 6px; }
    .wz-board-row {
      display: flex; align-items: center; gap: 8px;
      padding: 6px; border: 1px solid var(--border); border-radius: 8px;
      background: var(--bg-elev);
    }
    .wz-board-row .input { flex: 1; min-width: 120px; }

    .wz-review {
      padding: 24px;
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 14px;
    }
    .wz-review-hero { display: flex; gap: 16px; align-items: center; margin-bottom: 20px; }
    .wz-review-name { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
    .wz-review-sub { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
    .wz-review-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .wz-review-stat { padding: 12px; background: var(--bg-subtle); border-radius: 10px; }
    .wz-review-stat-label { font-size: 11px; color: var(--text-muted); }
    .wz-review-stat-val { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; margin-top: 2px; }
    .wz-review-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
    .wz-review-section-title {
      font-size: 11px; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;
    }
    .wz-review-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .wz-review-chip { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
    .wz-review-list { display: flex; flex-direction: column; gap: 6px; }
    .wz-review-board { display: flex; align-items: center; gap: 10px; font-size: 13px; }
    .wz-mail { color: var(--text-muted); font-size: 12px; margin-left: auto; }

    .wz-footer {
      border-top: 1px solid var(--border);
      background: var(--bg-elev);
      padding: 14px 40px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-shrink: 0;
    }
    .wz-footer-left, .wz-footer-right { display: flex; gap: 8px; }

    @media (max-width: 900px) {
      .wz-sidebar { display: none; }
      .wz-content { padding: 20px 20px; }
      .wz-footer { padding: 12px 20px; }
      .wz-grid { grid-template-columns: 1fr; }
      .wz-col-2 { grid-column: span 1; }
    }
  `]
})
export class NewClubWizardComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  toast = inject(ToastService);
  router = inject(Router);
  onboarding = inject(OnboardingService);

  inAuthFlow = input<boolean>(false);
  closed = output<void>();

  steps = STEPS;
  sports = SPORTS;
  cantons = CANTONS;
  colors = COLOR_PRESETS;
  teamPresets = TEAM_PRESETS;
  boardRoles = BOARD_ROLE_PRESETS;

  stepIdx = signal<number>(0);

  private todayPlus3Months(): string {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  form = {
    name: '',
    sport: 'Fussball',
    foundedYear: '',
    description: '',
    street: '',
    zip: '',
    city: '',
    canton: 'UR',
    website: '',
    email: '',
    phone: '',
    color: '#059669',
    defaultDue: 150,
    dueDate: this.todayPlus3Months(),
    language: 'DE',
    memberRange: '21 – 50',
  };

  private _teamId = 1;
  teams = signal<TeamDraft[]>([]);

  private _boardId = 1;
  board = signal<BoardDraft[]>([
    { id: 0, firstName: '', lastName: '', email: '', role: 'Präsident' },
  ]);

  currentStep = computed(() => this.steps[this.stepIdx()]);
  currentStepId = computed(() => this.currentStep().id);
  progressPct = computed(() => Math.round(((this.stepIdx() + 1) / this.steps.length) * 100));

  initials(): string {
    const parts = this.form.name.split(/\s+/).filter(Boolean);
    const i = parts.map(p => p[0]).slice(0, 3).join('').toUpperCase();
    return i || '?';
  }

  canAdvance(): boolean {
    const id = this.currentStepId();
    if (id === 'basics') return this.form.name.trim().length > 0;
    return true;
  }

  canFinish(): boolean {
    return this.form.name.trim().length > 0;
  }

  canJumpTo(idx: number): boolean {
    if (idx <= this.stepIdx()) return true;
    if (idx === this.stepIdx() + 1) return this.canAdvance();
    return false;
  }

  jumpTo(idx: number): void {
    if (idx > this.stepIdx() && !this.canJumpTo(idx)) return;
    this.stepIdx.set(Math.max(0, Math.min(idx, this.steps.length - 1)));
  }

  next(): void {
    if (!this.canAdvance()) return;
    if (this.stepIdx() < this.steps.length - 1) this.stepIdx.update(i => i + 1);
  }
  prev(): void { if (this.stepIdx() > 0) this.stepIdx.update(i => i - 1); }

  skipTeams(): void { this.next(); }
  skipBoard(): void { this.next(); }

  hasTeamName(name: string): boolean {
    return this.teams().some(t => t.name === name);
  }

  addPresetTeam(p: typeof TEAM_PRESETS[number]): void {
    this.teams.update(list => [...list, { id: this._teamId++, ...p }]);
  }
  addCustomTeam(): void {
    this.teams.update(list => [
      ...list,
      { id: this._teamId++, name: '', category: 'Aktive', short: '', color: this.form.color },
    ]);
  }
  removeTeam(id: number): void {
    this.teams.update(list => list.filter(t => t.id !== id));
  }

  addBoard(): void {
    this.board.update(list => [
      ...list,
      { id: this._boardId++, firstName: '', lastName: '', email: '', role: 'Trainer' },
    ]);
  }
  removeBoard(id: number): void {
    this.board.update(list => list.filter(b => b.id !== id));
  }

  finish(): void {
    if (!this.canFinish()) return;
    const shortName = this.form.name.split(/\s+/).map(w => w[0]).slice(0, 3).join('').toUpperCase() || 'NEW';
    const newClub = {
      id: 'c-' + Date.now(),
      name: this.form.name,
      logo: shortName,
      color: this.form.color,
      members: this.board().filter(b => b.email).length,
      role: 'Präsident',
    };
    this.data.clubs.push(newClub);
    this.state.club.set(newClub);
    this.state.setTweak('primaryColor', this.form.color);

    const invited = this.board().filter(b => b.email).length;
    this.toast.show({
      kind: 'success',
      title: `Verein "${this.form.name}" erstellt`,
      body: invited > 0
        ? `${invited} Einladungen werden versendet.`
        : 'Lade jetzt die ersten Mitglieder ein.',
    });

    if (this.inAuthFlow()) {
      this.state.authenticated.set(true);
    }
    this.state.newClubWizardOpen.set(false);
    this.closed.emit();
    this.router.navigateByUrl('/dashboard').then(() => {
      // Start onboarding tour ~600ms after nav, so DOM is ready
      setTimeout(() => this.onboarding.start(this.form.name || 'deinem neuen Verein'), 600);
    });
  }

  onClose(): void {
    if (this.inAuthFlow()) {
      this.state.authView.set('create-or-join');
    } else {
      this.state.newClubWizardOpen.set(false);
    }
    this.closed.emit();
  }
}
