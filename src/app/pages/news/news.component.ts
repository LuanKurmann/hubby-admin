import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../core/services/app-state.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import { NewsItem } from '../../core/models';

type TabKey = 'all' | 'club' | 'team';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [FormsModule, ModalComponent, IconComponent, AvatarComponent, FormatDatePipe],
  template: `
    <div style="padding:24px;display:flex;flex-direction:column;gap:16px">
      <!-- Page header -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <h1 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em">News &amp; Berichte</h1>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">{{ data.news.length }} publizierte Beiträge</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" type="button" (click)="openMatchReport()">
            <app-icon name="trophy" [size]="13" /> Matchbericht
          </button>
          <button class="btn btn-primary" type="button" (click)="newsModalOpen.set(true)">
            <app-icon name="plus" [size]="13" /> News
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:4px;border-bottom:1px solid var(--border);align-items:center;flex-wrap:wrap">
        @for (t of tabs; track t.k) {
          <button
            type="button"
            (click)="setTab(t.k)"
            [style.color]="activeTab() === t.k ? 'var(--text)' : 'var(--text-muted)'"
            [style.border-bottom]="'2px solid ' + (activeTab() === t.k ? 'var(--primary)' : 'transparent')"
            style="padding:8px 14px;font-size:13px;font-weight:500;background:transparent;border:0;margin-bottom:-1px;cursor:pointer">
            {{ t.l }}
          </button>
        }
        @if (activeTab() === 'team') {
          <select class="select" [ngModel]="teamTab()" (ngModelChange)="teamTab.set($event)" style="margin-left:8px;min-width:160px">
            @for (t of data.teams; track t.id) {
              <option [value]="t.id">{{ t.name }}</option>
            }
          </select>
        }
      </div>

      <!-- Content: feed + sidebar -->
      <div style="display:grid;grid-template-columns:1fr 300px;gap:16px;align-items:start">
        <div>
          @if (filtered().length === 0) {
            <div class="card" style="padding:40px;text-align:center">
              <div style="color:var(--text-muted);font-size:13px;margin-bottom:12px">Keine Beiträge vorhanden.</div>
              <button class="btn btn-primary" type="button" (click)="newsModalOpen.set(true)">
                <app-icon name="plus" [size]="13" /> Ersten Beitrag erstellen
              </button>
            </div>
          } @else {
            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:14px">
              @for (n of filtered(); track n.id) {
                <div class="card" style="overflow:hidden;cursor:pointer;transition:transform .15s,box-shadow .15s">
                  <div
                    [style.background]="coverBg(n)"
                    style="height:140px;position:relative;display:flex;align-items:center;justify-content:center">
                    <div style="color:#fff;opacity:0.35">
                      <app-icon [name]="coverIcon(n)" [size]="48" [stroke]="1.25" />
                    </div>
                    @if (isMatchReport(n)) {
                      <div style="position:absolute;top:10px;left:10px;padding:2px 8px;background:rgba(255,255,255,0.22);border-radius:4px;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Matchbericht</div>
                    } @else {
                      <div style="position:absolute;top:10px;left:10px;padding:2px 8px;background:rgba(255,255,255,0.22);border-radius:4px;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">
                        {{ typeBadge(n) }}
                      </div>
                    }
                  </div>
                  <div style="padding:14px">
                    <div style="display:flex;gap:6px;margin-bottom:8px">
                      @if (teamFor(n); as t) {
                        <span class="chip" [style.background]="t.color + '18'" [style.color]="t.color" style="border-color:transparent">{{ t.short }}</span>
                      } @else {
                        <span class="chip">Vereinsweit</span>
                      }
                    </div>
                    <h3 style="margin:0 0 6px;font-size:15px;font-weight:600;letter-spacing:-0.01em;line-height:1.3">{{ n.title }}</h3>
                    <p style="margin:0;font-size:12px;color:var(--text-muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
                      {{ n.excerpt }}
                    </p>
                    <div class="divider" style="margin:12px 0 8px;height:1px;background:var(--border)"></div>
                    <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--text-muted);gap:8px">
                      <div style="display:inline-flex;align-items:center;gap:6px;min-width:0">
                        <app-avatar [name]="n.author" size="sm" />
                        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ n.author }} · {{ relTime(n.publishedAt) }}</span>
                      </div>
                      <span style="display:inline-flex;align-items:center;gap:3px;flex-shrink:0">
                        <app-icon name="eye" [size]="11" /> {{ n.views }}
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Sidebar -->
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="card" style="padding:14px">
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:10px">Beliebt diese Woche</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              @for (n of popular(); track n.id; let i = $index) {
                <div style="display:flex;gap:10px;align-items:flex-start">
                  <div style="font-size:18px;font-weight:700;color:var(--text-muted);width:18px;font-variant-numeric:tabular-nums">{{ i + 1 }}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:12px;font-weight:500;line-height:1.3">{{ n.title }}</div>
                    <div style="font-size:11px;color:var(--text-muted);display:inline-flex;align-items:center;gap:4px;margin-top:2px">
                      <app-icon name="eye" [size]="10" /> {{ n.views }}
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="card" style="padding:14px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted)">Entwürfe</div>
              <span class="chip">{{ drafts.length }}</span>
            </div>
            @if (drafts.length === 0) {
              <div style="font-size:12px;color:var(--text-muted)">Keine Entwürfe</div>
            } @else {
              <div style="display:flex;flex-direction:column;gap:8px">
                @for (d of drafts; track d.id) {
                  <div style="padding:8px;background:var(--bg-subtle);border-radius:6px">
                    <div style="font-size:12px;font-weight:500">{{ d.title }}</div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">zuletzt bearbeitet {{ d.editedAgo }}</div>
                  </div>
                }
              </div>
            }
          </div>

          <button class="btn btn-primary" type="button" (click)="openMatchReport()" style="justify-content:center">
            <app-icon name="trophy" [size]="13" /> Matchbericht schreiben
          </button>
        </div>
      </div>
    </div>

    <!-- Create News Modal -->
    <app-modal [open]="newsModalOpen()" title="News erstellen" [width]="640" (closed)="newsModalOpen.set(false)">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label class="label">Titel</label>
          <input class="input" placeholder="z.B. Tolle Leistung im Derby" [(ngModel)]="newsTitle" />
        </div>
        <div>
          <label class="label">Cover-Bild</label>
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:20px;border:2px dashed var(--border);border-radius:8px;color:var(--text-muted);font-size:12px;cursor:pointer">
            <app-icon name="upload" [size]="16" /> Bild hochladen oder hierher ziehen
          </div>
        </div>
        <div>
          <label class="label">Inhalt</label>
          <div style="border:1px solid var(--border);border-radius:6px">
            <div style="display:flex;gap:2px;padding:6px;border-bottom:1px solid var(--border);background:var(--bg-subtle)">
              @for (s of toolbarItems; track s) {
                <button class="btn btn-ghost btn-sm" type="button" style="height:26px;min-width:26px;padding:0 6px">{{ s }}</button>
              }
            </div>
            <textarea
              class="textarea"
              rows="6"
              style="border:0;border-radius:0;width:100%"
              placeholder="Schreibe hier deinen Beitrag …"
              [(ngModel)]="newsBody"></textarea>
          </div>
        </div>
        <div>
          <label class="label">Sichtbarkeit</label>
          <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-subtle);border-radius:6px;margin-bottom:6px;cursor:pointer">
            <input type="radio" name="vis" value="all" [(ngModel)]="visibility" />
            <span style="font-size:13px">Alle Vereinsmitglieder</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-subtle);border-radius:6px;cursor:pointer">
            <input type="radio" name="vis" value="team" [(ngModel)]="visibility" />
            <span style="font-size:13px">Nur bestimmte Teams</span>
          </label>
          @if (visibility === 'team') {
            <select class="select" [(ngModel)]="newsTeam" style="margin-top:8px">
              @for (t of data.teams; track t.id) {
                <option [value]="t.id">{{ t.name }}</option>
              }
            </select>
          }
        </div>
      </div>
      <ng-container slot="footer">
        <button class="btn" type="button" (click)="newsModalOpen.set(false)">Abbrechen</button>
        <button class="btn" type="button" (click)="saveDraft()">Als Entwurf speichern</button>
        <button class="btn btn-primary" type="button" (click)="publishNews()">Publizieren</button>
      </ng-container>
    </app-modal>

    <!-- Match Report Modal -->
    <app-modal [open]="matchModalOpen()" title="Matchbericht" [width]="520" (closed)="matchModalOpen.set(false)">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label class="label">Match auswählen</label>
          <select class="select" [(ngModel)]="selectedMatchId">
            @for (m of matches(); track m.id) {
              <option [value]="m.id">{{ m.title }} · {{ m.start | formatDate:'date' }}</option>
            }
          </select>
        </div>
        <div>
          <label class="label">Resultat</label>
          <div style="display:flex;align-items:center;gap:12px;justify-content:center">
            <div style="text-align:center">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Heim</div>
              <input class="input" type="number" [(ngModel)]="homeScore" style="width:60px;font-size:20px;font-weight:600;text-align:center;height:52px" />
            </div>
            <div style="font-size:22px;font-weight:600;color:var(--text-muted)">:</div>
            <div style="text-align:center">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Auswärts</div>
              <input class="input" type="number" [(ngModel)]="awayScore" style="width:60px;font-size:20px;font-weight:600;text-align:center;height:52px" />
            </div>
          </div>
        </div>
        <div>
          <label class="label">Kurzbericht <span style="color:var(--text-muted);font-weight:400">(max. 500 Zeichen, {{ matchSummary().length }}/500)</span></label>
          <textarea
            class="textarea"
            rows="4"
            maxlength="500"
            placeholder="Wie lief das Spiel?"
            [ngModel]="matchSummary()"
            (ngModelChange)="matchSummary.set($event)"></textarea>
        </div>
      </div>
      <ng-container slot="footer">
        <button class="btn" type="button" (click)="matchModalOpen.set(false)">Abbrechen</button>
        <button class="btn btn-primary" type="button" (click)="publishMatchReport()">Publizieren</button>
      </ng-container>
    </app-modal>
  `,
})
export class NewsComponent {
  state = inject(AppStateService);
  data = inject(MockDataService);
  toast = inject(ToastService);

  activeTab = signal<TabKey>('all');
  teamTab = signal<string>('');

  newsModalOpen = signal<boolean>(false);
  matchModalOpen = signal<boolean>(false);

  newsTitle = '';
  newsBody = '';
  visibility: 'all' | 'team' = 'all';
  newsTeam = '';

  selectedMatchId = '';
  homeScore = 0;
  awayScore = 0;
  matchSummary = signal<string>('');

  readonly tabs: { k: TabKey; l: string }[] = [
    { k: 'all', l: 'Alle' },
    { k: 'club', l: 'Vereinsweit' },
    { k: 'team', l: 'Pro Team' },
  ];

  readonly toolbarItems = ['B', 'I', 'U', '•', '1.', '🔗'];

  readonly drafts = [
    { id: 'd1', title: 'Saisonrückblick 2025/26', editedAgo: 'vor 2 Tagen' },
    { id: 'd2', title: 'Interview mit dem Trainer', editedAgo: 'vor 5 Tagen' },
  ];

  constructor() {
    if (this.data.teams.length > 0) this.teamTab.set(this.data.teams[0].id);
  }

  filtered = computed<NewsItem[]>(() => {
    const t = this.activeTab();
    if (t === 'all') return this.data.news;
    if (t === 'club') return this.data.news.filter(n => !n.team);
    return this.data.news.filter(n => n.team === this.teamTab());
  });

  popular = computed<NewsItem[]>(() =>
    [...this.data.news].sort((a, b) => b.views - a.views).slice(0, 4)
  );

  matches = computed(() => this.data.events.filter(e => e.type === 'match'));

  setTab(t: TabKey): void {
    this.activeTab.set(t);
  }

  openMatchReport(): void {
    const m = this.matches();
    if (m.length > 0 && !this.selectedMatchId) this.selectedMatchId = m[0].id;
    this.matchModalOpen.set(true);
  }

  teamFor(n: NewsItem) {
    return this.data.getTeam(n.team);
  }

  coverBg(n: NewsItem): string {
    const cover = n.cover || 'news';
    if (cover === 'match') return 'linear-gradient(135deg, #DC2626, #7F1D1D)';
    if (cover === 'event') return 'linear-gradient(135deg, #059669, #065F46)';
    return 'linear-gradient(135deg, #1E40AF, #1E3A8A)';
  }

  coverIcon(n: NewsItem): string {
    const cover = n.cover || 'news';
    if (cover === 'match') return 'trophy';
    if (cover === 'event') return 'calendar';
    return 'news';
  }

  isMatchReport(n: NewsItem): boolean {
    return n.type === 'match';
  }

  typeBadge(n: NewsItem): string {
    if (n.type === 'match') return 'Matchbericht';
    if (n.cover === 'event') return 'Event';
    return 'News';
  }

  relTime(d: Date): string {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'jetzt';
    if (mins < 60) return `vor ${mins} Min`;
    if (mins < 1440) return `vor ${Math.floor(mins / 60)} Std`;
    const days = Math.floor(mins / 1440);
    return days === 1 ? 'gestern' : `vor ${days} Tagen`;
  }

  saveDraft(): void {
    this.newsModalOpen.set(false);
    this.toast.show({ body: 'Als Entwurf gespeichert' });
    this.resetNewsForm();
  }

  publishNews(): void {
    if (!this.newsTitle.trim()) {
      this.toast.show({ kind: 'error', body: 'Bitte einen Titel angeben.' });
      return;
    }
    this.newsModalOpen.set(false);
    this.toast.show({ kind: 'success', title: 'News publiziert', body: this.newsTitle });
    this.resetNewsForm();
  }

  publishMatchReport(): void {
    this.matchModalOpen.set(false);
    this.toast.show({ kind: 'success', title: 'Matchbericht publiziert', body: `${this.homeScore} : ${this.awayScore}` });
    this.homeScore = 0;
    this.awayScore = 0;
    this.matchSummary.set('');
  }

  private resetNewsForm(): void {
    this.newsTitle = '';
    this.newsBody = '';
    this.visibility = 'all';
    this.newsTeam = '';
  }
}
