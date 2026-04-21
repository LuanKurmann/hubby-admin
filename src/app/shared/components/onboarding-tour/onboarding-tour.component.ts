import { Component, inject, signal, effect, HostListener } from '@angular/core';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { IconComponent } from '../icon/icon.component';
import { TPipe } from '../../pipes/t.pipe';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-onboarding-tour',
  standalone: true,
  imports: [IconComponent, TPipe],
  template: `
    @if (tour.active() && tour.currentStep(); as step) {
      <!-- Backdrop with cutout via box-shadow -->
      <div class="tour-backdrop"
        [style.top.px]="rect().top - 8"
        [style.left.px]="rect().left - 8"
        [style.width.px]="rect().width + 16"
        [style.height.px]="rect().height + 16"
        [class.no-spotlight]="step.target === 'body'"></div>

      <!-- Tooltip card -->
      <div class="tour-card"
        [style.top.px]="cardPos().top"
        [style.left.px]="cardPos().left">
        <div class="tour-header">
          <div class="tour-progress-text">
            {{ 'onboarding.step' | t:{ n: tour.progress().current, total: tour.progress().total } }}
          </div>
          <button class="btn btn-ghost btn-icon" (click)="tour.skip()" title="Schliessen">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
        <div class="tour-title">{{ step.titleKey | t:step.params }}</div>
        <div class="tour-body">{{ step.bodyKey | t:step.params }}</div>

        <!-- Progress dots -->
        <div class="tour-dots">
          @for (_ of dotArr(); track $index) {
            <div class="tour-dot" [class.active]="$index === tour.stepIdx()"></div>
          }
        </div>

        <!-- Actions -->
        <div class="tour-actions">
          @if (tour.stepIdx() > 0) {
            <button class="btn" (click)="tour.prev()">
              <app-icon name="chevronLeft" [size]="12" /> {{ 'onboarding.prev' | t }}
            </button>
          } @else {
            <button class="btn btn-ghost" (click)="tour.skip()">
              {{ 'onboarding.skip' | t }}
            </button>
          }
          <div style="flex:1"></div>
          @if (tour.stepIdx() < tour.steps().length - 1) {
            <button class="btn btn-primary" (click)="tour.next()">
              {{ 'onboarding.next' | t }} <app-icon name="chevronRight" [size]="12" />
            </button>
          } @else {
            <button class="btn btn-primary" (click)="tour.next()">
              {{ 'onboarding.finish' | t }} <app-icon name="check" [size]="12" />
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .tour-backdrop {
      position: fixed;
      z-index: 99;
      border-radius: 8px;
      box-shadow: 0 0 0 9999px rgba(12, 10, 9, 0.62);
      pointer-events: none;
      transition: top .22s, left .22s, width .22s, height .22s;
    }
    .tour-backdrop.no-spotlight {
      top: 0 !important;
      left: 0 !important;
      width: 0 !important;
      height: 0 !important;
    }
    .tour-card {
      position: fixed;
      z-index: 100;
      width: 340px;
      max-width: calc(100vw - 24px);
      background: var(--bg-elev);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: var(--shadow-xl);
      padding: 16px 18px;
      animation: slideInUp .22s cubic-bezier(.2,.9,.3,1);
    }
    .tour-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .tour-progress-text {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary);
    }
    .tour-title {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.01em;
      margin-bottom: 6px;
    }
    .tour-body {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.55;
      margin-bottom: 14px;
    }
    .tour-dots {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
    }
    .tour-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--border-strong);
      transition: background .15s, transform .15s;
    }
    .tour-dot.active {
      background: var(--primary);
      transform: scale(1.3);
    }
    .tour-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `],
})
export class OnboardingTourComponent {
  tour = inject(OnboardingService);

  rect = signal<Rect>({ top: 0, left: 0, width: 0, height: 0 });
  cardPos = signal<{ top: number; left: number }>({ top: 100, left: 100 });

  dotArr = () => Array.from({ length: this.tour.steps().length });

  constructor() {
    effect(() => {
      if (!this.tour.active()) return;
      const step = this.tour.currentStep();
      if (!step) return;
      // Defer until DOM settles
      setTimeout(() => this.updatePosition(step.target, step.placement || 'right'), 50);
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    const step = this.tour.currentStep();
    if (step) this.updatePosition(step.target, step.placement || 'right');
  }

  private updatePosition(selector: string, placement: string): void {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el || selector === 'body') {
      this.rect.set({ top: 0, left: 0, width: 0, height: 0 });
      // Center the card
      this.cardPos.set({
        top: Math.max(40, window.innerHeight / 2 - 150),
        left: Math.max(12, window.innerWidth / 2 - 170),
      });
      return;
    }
    const r = el.getBoundingClientRect();
    this.rect.set({ top: r.top, left: r.left, width: r.width, height: r.height });

    // Position card based on placement
    const cardW = 340;
    const cardH = 220;
    const margin = 16;
    let top = 0, left = 0;

    if (placement === 'right') {
      top = r.top;
      left = r.right + margin;
      if (left + cardW > window.innerWidth - 12) {
        left = r.left - cardW - margin;
      }
      if (left < 12) left = 12;
    } else if (placement === 'left') {
      top = r.top;
      left = r.left - cardW - margin;
      if (left < 12) left = r.right + margin;
    } else if (placement === 'bottom') {
      top = r.bottom + margin;
      left = Math.max(12, r.left + r.width / 2 - cardW / 2);
    } else {
      top = r.top - cardH - margin;
      left = Math.max(12, r.left + r.width / 2 - cardW / 2);
    }

    // Clamp to viewport
    if (top + cardH > window.innerHeight - 12) top = window.innerHeight - cardH - 12;
    if (top < 12) top = 12;
    if (left + cardW > window.innerWidth - 12) left = window.innerWidth - cardW - 12;

    this.cardPos.set({ top, left });

    // Scroll target into view if needed
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}
