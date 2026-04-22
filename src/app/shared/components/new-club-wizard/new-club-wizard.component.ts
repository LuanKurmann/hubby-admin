import { Component, inject, signal, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService } from '../../../core/services/app-state.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService, Locale } from '../../../core/i18n/i18n.service';
import { IconComponent } from '../icon/icon.component';
import { HubbyLogoComponent } from '../../../pages/auth/hubby-logo.component';
import { InviteCode } from '../../../core/models';

type StepId = 'basics' | 'location' | 'branding' | 'teams' | 'invites' | 'defaults' | 'finish';

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

interface InviteDraft {
  id: number;
  code: string;
  label: string;
  roleIds: string[];
  maxUses: number | null;
  expiresInDays: number | null;
}

const STEPS: StepDef[] = [
  { id: 'basics', label: 'Grunddaten', icon: 'building', hint: 'Vereinsname, Sportart und Gründungsjahr' },
  { id: 'location', label: 'Standort', icon: 'mapPin', hint: 'Adresse und Kontaktdaten' },
  { id: 'branding', label: 'Branding', icon: 'sparkles', hint: 'Farbe und Logo' },
  { id: 'teams', label: 'Teams', icon: 'ball', hint: 'Erste Mannschaften anlegen' },
  { id: 'invites', label: 'Einladungscodes', icon: 'key', hint: 'Wie Mitglieder beitreten' },
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

interface InvitePreset {
  key: string;
  label: string;
  short: string;
  roleIds: string[];
  maxUses: number | null;
  expiresInDays: number | null;
}

const INVITE_PRESETS: InvitePreset[] = [
  { key: 'president', label: 'Präsident', short: 'PRES', roleIds: ['r1'], maxUses: 1, expiresInDays: 30 },
  { key: 'treasurer', label: 'Kassier', short: 'KASS', roleIds: ['r2'], maxUses: 1, expiresInDays: 30 },
  { key: 'secretary', label: 'Aktuar', short: 'AKTU', roleIds: ['r3'], maxUses: 1, expiresInDays: 30 },
  { key: 'coach', label: 'Trainer', short: 'TRAI', roleIds: ['r4'], maxUses: 5, expiresInDays: 90 },
  { key: 'member', label: 'Aktivmitglied', short: 'MIT', roleIds: ['r5'], maxUses: 50, expiresInDays: 90 },
  { key: 'passive', label: 'Passivmitglied', short: 'PASS', roleIds: ['r6'], maxUses: null, expiresInDays: 365 },
];

const COLOR_PRESETS = ['#DC2626', '#EA580C', '#F59E0B', '#059669', '#0891B2', '#2563EB', '#7C3AED', '#DB2777', '#0F172A'];

const SPORTS = ['Fussball', 'Turnen', 'Unihockey', 'Handball', 'Volleyball', 'Basketball', 'Eishockey', 'Leichtathletik', 'Tennis', 'Schwimmen', 'Andere'];

const CANTONS = ['AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH'];

function randomCodeSuffix(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

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

              @case ('invites') {
                <h2 class="wz-h2">Wie treten Mitglieder bei?</h2>
                <p class="wz-p">
                  Bei Hubby treten Mitglieder über <strong>Einladungscodes</strong> bei — keine direkten E-Mail-Einladungen nötig.
                  Wähle unten Presets oder erstelle eigene Codes. Du kannst sie anschliessend per E-Mail, WhatsApp oder Aushang teilen.
                  <button type="button" class="wz-link" (click)="skipInvites()">Überspringen</button>
                </p>

                <div class="wz-presets" style="margin-top:0;margin-bottom:16px">
                  <div class="wz-presets-label">Schnellstart — Preset wählen:</div>
                  <div class="wz-presets-chips">
                    @for (p of invitePresets; track p.key) {
                      @if (!hasInvitePreset(p.key)) {
                        <button type="button" class="wz-chip" (click)="addPresetInvite(p)">
                          <app-icon name="plus" [size]="10" /> {{ p.label }}
                          <span style="opacity:0.6;margin-left:4px">
                            ({{ p.maxUses ?? '∞' }}×)
                          </span>
                        </button>
                      }
                    }
                    <button type="button" class="wz-chip wz-chip-custom" (click)="addCustomInvite()">
                      <app-icon name="plus" [size]="10" /> Eigener Code
                    </button>
                  </div>
                </div>

                @if (invites().length === 0) {
                  <div class="wz-empty">
                    <app-icon name="key" [size]="32" />
                    <div>Noch keine Einladungscodes — wähle oben ein Preset oder überspringe diesen Schritt.</div>
                  </div>
                }

                @if (invites().length > 0) {
                  <div class="wz-invite-list">
                    @for (inv of invites(); track inv.id) {
                      <div class="wz-invite-row">
                        <code class="wz-invite-code">{{ inv.code }}</code>
                        <input class="input" [(ngModel)]="inv.label" [name]="'il' + inv.id" placeholder="Beschriftung" style="flex:1;min-width:140px">
                        <select class="select" [(ngModel)]="inv.maxUses" [name]="'iu' + inv.id" style="width:110px">
                          <option [ngValue]="1">1× Nutzung</option>
                          <option [ngValue]="5">5× Nutzungen</option>
                          <option [ngValue]="20">20×</option>
                          <option [ngValue]="50">50×</option>
                          <option [ngValue]="null">Unbegrenzt</option>
                        </select>
                        <div class="wz-invite-roles" [title]="inviteRoleNames(inv)">
                          <app-icon name="shield" [size]="12" />
                          <span>{{ inv.roleIds.length }} {{ inv.roleIds.length === 1 ? 'Rolle' : 'Rollen' }}</span>
                        </div>
                        <button type="button" class="btn btn-ghost btn-icon" (click)="regenerateCode(inv)" title="Neu generieren">
                          <app-icon name="sparkles" [size]="13" />
                        </button>
                        <button type="button" class="btn btn-ghost btn-icon" (click)="removeInvite(inv.id)" title="Entfernen">
                          <app-icon name="trash" [size]="14" />
                        </button>
                      </div>
                    }
                  </div>

                  <div style="margin-top:12px;padding:10px 12px;background:var(--bg-subtle);border-radius:8px;font-size:12px;color:var(--text-muted);line-height:1.55;display:flex;align-items:flex-start;gap:8px">
                    <app-icon name="info" [size]="14" style="flex-shrink:0;margin-top:1px" />
                    <span>
                      Diese Codes werden nach Erstellung des Vereins automatisch aktiv und stehen dir unter
                      <strong>Einladungscodes</strong> zum Teilen zur Verfügung.
                    </span>
                  </div>
                }
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
                    <select class="select" [ngModel]="form.language" name="language" (ngModelChange)="onLanguageChange($event)">
                      <option value="DE">Deutsch</option>
                      <option value="FR">Français</option>
                      <option value="IT">Italiano</option>
                    </select>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                      Die UI wechselt sofort. Alle Vereinsmitglieder können ihre eigene Sprache im Profil setzen.
                    </div>
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
                      <div class="wz-review-stat-label">Einladungscodes</div>
                      <div class="wz-review-stat-val">{{ invites().length }}</div>
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
                      <div class="wz-review-section-title">Teams ({{ teams().length }})</div>
                      <div class="wz-review-chips">
                        @for (t of teams(); track t.id) {
                          <span class="wz-review-chip" [style.background]="t.color + '22'" [style.color]="t.color">
                            {{ t.name }}
                          </span>
                        }
                      </div>
                    </div>
                  }

                  @if (invites().length > 0) {
                    <div class="wz-review-section">
                      <div class="wz-review-section-title">Einladungscodes ({{ invites().length }})</div>
                      <div class="wz-review-list">
                        @for (inv of invites(); track inv.id) {
                          <div class="wz-review-board">
                            <code style="font-family:ui-monospace,monospace;font-size:12px;padding:3px 8px;border-radius:4px;background:var(--bg-subtle);letter-spacing:0.04em;font-weight:600">{{ inv.code }}</code>
                            <span class="chip">{{ inv.label }}</span>
                            <span class="wz-mail">{{ inv.maxUses === null ? 'unbegrenzt' : inv.maxUses + '× Nutzungen' }}</span>
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
                @if (currentStepId() === 'teams' || currentStepId() === 'invites') {
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

    .wz-invite-list { display: flex; flex-direction: column; gap: 6px; }
    .wz-invite-row {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px;
      background: var(--bg-elev);
      flex-wrap: wrap;
    }
    .wz-invite-code {
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 6px;
      background: var(--bg-subtle);
      letter-spacing: 0.06em;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .wz-invite-roles {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 8px; border-radius: 999px;
      background: var(--bg-subtle);
      font-size: 11px; color: var(--text-muted);
      white-space: nowrap;
    }

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
  i18n = inject(I18nService);

  inAuthFlow = input<boolean>(false);
  closed = output<void>();

  steps = STEPS;
  sports = SPORTS;
  cantons = CANTONS;
  colors = COLOR_PRESETS;
  teamPresets = TEAM_PRESETS;
  invitePresets = INVITE_PRESETS;

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

  private _inviteId = 1;
  invites = signal<InviteDraft[]>([]);

  private codePrefix(): string {
    const parts = this.form.name.split(/\s+/).filter(Boolean);
    const p = parts.map(w => w[0]).slice(0, 3).join('').toUpperCase();
    return p || 'NEW';
  }

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
  skipInvites(): void { this.next(); }

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

  // --- Invites (presets + custom) ---
  hasInvitePreset(key: string): boolean {
    return this.invites().some(i => i.label === this.presetLabel(key));
  }

  private presetLabel(key: string): string {
    return INVITE_PRESETS.find(p => p.key === key)?.label ?? key;
  }

  addPresetInvite(p: InvitePreset): void {
    this.invites.update(list => [
      ...list,
      {
        id: this._inviteId++,
        code: `${this.codePrefix()}-${p.short}-${randomCodeSuffix()}`,
        label: p.label,
        roleIds: [...p.roleIds],
        maxUses: p.maxUses,
        expiresInDays: p.expiresInDays,
      },
    ]);
  }

  addCustomInvite(): void {
    this.invites.update(list => [
      ...list,
      {
        id: this._inviteId++,
        code: `${this.codePrefix()}-CUSTOM-${randomCodeSuffix()}`,
        label: 'Eigener Code',
        roleIds: ['r5'],
        maxUses: 20,
        expiresInDays: 30,
      },
    ]);
  }

  regenerateCode(inv: InviteDraft): void {
    const parts = inv.code.split('-');
    const middle = parts.length > 2 ? parts[1] : 'CODE';
    inv.code = `${this.codePrefix()}-${middle}-${randomCodeSuffix()}`;
  }

  removeInvite(id: number): void {
    this.invites.update(list => list.filter(i => i.id !== id));
  }

  inviteRoleNames(inv: InviteDraft): string {
    return inv.roleIds
      .map(id => this.data.getRole(id)?.name)
      .filter(Boolean)
      .join(', ');
  }

  // --- Language (live-switches UI) ---
  onLanguageChange(v: 'DE' | 'FR' | 'IT'): void {
    this.form.language = v;
    this.i18n.setLocale(v.toLowerCase() as Locale);
  }

  finish(): void {
    if (!this.canFinish()) return;

    // 1) Create the club and switch to it
    const newClub = {
      id: 'c-' + Date.now(),
      name: this.form.name,
      logo: this.codePrefix(),
      color: this.form.color,
      members: 0,
      role: 'Präsident',
    };
    this.data.addClub(newClub);
    this.state.club.set(newClub);
    this.state.setTweak('primaryColor', this.form.color);

    // 2) Persist language (wizard already called setLocale live; make sure it sticks)
    this.i18n.setLocale(this.form.language.toLowerCase() as Locale);

    // 3) Register all invite code drafts in the mock data service
    const created: InviteCode[] = [];
    for (const d of this.invites()) {
      const expiresAt = d.expiresInDays
        ? new Date(Date.now() + d.expiresInDays * 24 * 3600 * 1000)
        : null;
      const code: InviteCode = {
        id: 'inv-' + Date.now() + '-' + d.id,
        code: d.code,
        roleIds: [...d.roleIds],
        teamId: null,
        maxUses: d.maxUses,
        usedCount: 0,
        expiresAt,
        note: `Aus Setup-Wizard: ${d.label}`,
        createdAt: new Date(),
        createdBy: this.state.user().name,
        status: 'active',
      };
      this.data.addInviteCode(code);
      created.push(code);
    }

    // 4) Toast summary
    const parts: string[] = [];
    if (this.teams().length > 0) parts.push(`${this.teams().length} Teams`);
    if (created.length > 0) parts.push(`${created.length} Einladungscodes`);
    this.toast.show({
      kind: 'success',
      title: `Verein "${this.form.name}" erstellt`,
      body: parts.length > 0
        ? `${parts.join(' · ')} angelegt. Bereit loszulegen!`
        : 'Bereit loszulegen! Lade jetzt die ersten Mitglieder ein.',
    });

    // 5) Auth flow: log in
    if (this.inAuthFlow()) {
      this.state.authenticated.set(true);
    }

    // 6) Close wizard, navigate, start onboarding tour
    this.state.newClubWizardOpen.set(false);
    this.closed.emit();
    this.router.navigateByUrl('/dashboard').then(() => {
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
