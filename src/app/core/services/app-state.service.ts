import { Injectable, signal, effect } from '@angular/core';
import { Club, Member, CalendarEvent, Tweaks, User } from '../models';

function loadLS<T>(key: string, def: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : def;
  } catch { return def; }
}

function saveLS(key: string, val: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const DEFAULT_TWEAKS: Tweaks = { theme: 'dark', density: 'compact', primaryColor: '#059669' };

@Injectable({ providedIn: 'root' })
export class AppStateService {
  // Persistence
  authenticated = signal<boolean>(loadLS('hubby-auth', false));
  page = signal<string>(loadLS('hubby-page', 'dashboard'));
  collapsed = signal<boolean>(loadLS('hubby-sb', false));
  club = signal<Club>(loadLS('hubby-club', { id: 'c1', name: 'FC Seedorf', logo: 'FCS', color: '#DC2626', members: 168, role: 'Präsident' }));
  tweaks = signal<Tweaks>(loadLS('hubby-tweaks', DEFAULT_TWEAKS));

  // Session
  user = signal<User>({ name: 'Markus Gerber', email: 'markus@fc-seedorf.ch' });
  authView = signal<string>('login');
  loading = signal<boolean>(false);

  // Overlays
  cmdOpen = signal<boolean>(false);
  shortcutsOpen = signal<boolean>(false);
  clubSwitcherOpen = signal<boolean>(false);
  profileMenuAnchor = signal<string | null>(null);
  notifOpen = signal<boolean>(false);

  // Drawers / Modals
  memberOpen = signal<Member | null>(null);
  eventOpen = signal<CalendarEvent | null>(null);
  addMemberOpen = signal<boolean>(false);
  addEventOpen = signal<boolean>(false);
  addEventInitial = signal<{ date: Date; hour?: number } | null>(null);
  addNewsOpen = signal<boolean>(false);

  readonly notifications = signal<number>(3);

  constructor() {
    // Persist signals
    effect(() => saveLS('hubby-auth', this.authenticated()));
    effect(() => saveLS('hubby-page', this.page()));
    effect(() => saveLS('hubby-sb', this.collapsed()));
    effect(() => saveLS('hubby-club', this.club()));
    effect(() => saveLS('hubby-tweaks', this.tweaks()));

    // Apply theme / density / primary color to DOM
    effect(() => {
      const t = this.tweaks();
      document.documentElement.setAttribute('data-theme', t.theme);
      document.documentElement.setAttribute('data-density', t.density);
      document.documentElement.style.setProperty('--primary', t.primaryColor);
      document.documentElement.style.setProperty('--primary-hover', this.darken(t.primaryColor, 0.12));
      document.documentElement.style.setProperty('--primary-subtle', this.toRgba(t.primaryColor, t.theme === 'dark' ? 0.14 : 0.08));
      document.documentElement.style.setProperty('--primary-subtle-border', this.toRgba(t.primaryColor, 0.3));
    });
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }

  private toRgba(hex: string, alpha: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private darken(hex: string, amount: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    const f = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
    return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
  }

  setPage(p: string): void {
    this.loading.set(true);
    this.page.set(p);
    setTimeout(() => this.loading.set(false), 280);
  }

  setTweak<K extends keyof Tweaks>(key: K, value: Tweaks[K]): void {
    this.tweaks.update(t => ({ ...t, [key]: value }));
  }

  openMember(m: Member): void { this.memberOpen.set(m); }
  closeMember(): void { this.memberOpen.set(null); }
  openEvent(e: CalendarEvent): void { this.eventOpen.set(e); }
  closeEvent(): void { this.eventOpen.set(null); }
  openAddEvent(date?: Date, hour?: number): void {
    this.addEventInitial.set(date ? { date, hour } : null);
    this.addEventOpen.set(true);
  }
}
