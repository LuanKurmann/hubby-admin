import { Injectable, signal, computed } from '@angular/core';

export interface TourStep {
  id: string;
  target: string; // CSS selector or [data-tour] value
  titleKey: string;
  bodyKey: string;
  params?: Record<string, string | number>;
  placement?: 'right' | 'bottom' | 'left' | 'top';
}

const DEFAULT_STEPS: Omit<TourStep, 'params'>[] = [
  { id: 'welcome', target: 'body', titleKey: 'onboarding.welcomeTitle', bodyKey: 'onboarding.welcomeBody', placement: 'bottom' },
  { id: 'invites', target: '[data-tour="nav-invites"]', titleKey: 'onboarding.invitesTitle', bodyKey: 'onboarding.invitesBody', placement: 'right' },
  { id: 'events', target: '[data-tour="nav-events"]', titleKey: 'onboarding.eventsTitle', bodyKey: 'onboarding.eventsBody', placement: 'right' },
  { id: 'settings', target: '[data-tour="nav-settings"]', titleKey: 'onboarding.settingsTitle', bodyKey: 'onboarding.settingsBody', placement: 'right' },
  { id: 'search', target: '.topbar-search', titleKey: 'onboarding.searchTitle', bodyKey: 'onboarding.searchBody', placement: 'bottom' },
];

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  active = signal<boolean>(false);
  stepIdx = signal<number>(0);
  steps = signal<TourStep[]>([]);

  currentStep = computed<TourStep | null>(() => {
    const all = this.steps();
    const idx = this.stepIdx();
    return all[idx] ?? null;
  });

  progress = computed(() => ({ current: this.stepIdx() + 1, total: this.steps().length }));

  private clubName = signal<string>('Hubby');

  start(clubName: string = 'Hubby'): void {
    this.clubName.set(clubName);
    this.steps.set(DEFAULT_STEPS.map(s =>
      s.id === 'welcome' ? { ...s, params: { club: clubName } } : s
    ));
    this.stepIdx.set(0);
    this.active.set(true);
    this.markSeen();
  }

  next(): void {
    const next = this.stepIdx() + 1;
    if (next >= this.steps().length) this.finish();
    else this.stepIdx.set(next);
  }

  prev(): void {
    this.stepIdx.update(v => Math.max(0, v - 1));
  }

  skip(): void {
    this.finish();
  }

  finish(): void {
    this.active.set(false);
    this.stepIdx.set(0);
  }

  hasSeen(): boolean {
    try { return localStorage.getItem('hubby-onboarded') === '1'; } catch { return false; }
  }

  private markSeen(): void {
    try { localStorage.setItem('hubby-onboarded', '1'); } catch {}
  }
}
