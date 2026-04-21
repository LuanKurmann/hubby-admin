import { Component, inject, input, output } from '@angular/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { IconComponent } from '../icon/icon.component';

const PRIMARY_COLORS = ['#DC2626','#EA580C','#F59E0B','#059669','#2563EB','#7C3AED','#DB2777','#0F172A'];

@Component({
  selector: 'app-tweaks-panel',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div style="position:fixed;bottom:16px;right:16px;width:280px;background:var(--bg-elev);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow-lg);z-index:90">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:13px;font-weight:600">Tweaks</div>
        <button class="btn btn-ghost btn-icon" (click)="close.emit()"><app-icon name="x" [size]="14" /></button>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:14px">
        <div>
          <div class="label">Theme</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;background:var(--bg-subtle);padding:2px;border-radius:6px">
            @for (opt of themes; track opt.k) {
              <button (click)="state.setTweak('theme', opt.k)"
                [style.background]="state.tweaks().theme === opt.k ? 'var(--bg-elev)' : 'transparent'"
                [style.box-shadow]="state.tweaks().theme === opt.k ? 'var(--shadow-xs)' : 'none'"
                style="padding:6px 10px;border-radius:5px;font-size:12px;font-weight:500">{{ opt.l }}</button>
            }
          </div>
        </div>
        <div>
          <div class="label">Dichte</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;background:var(--bg-subtle);padding:2px;border-radius:6px">
            @for (opt of densities; track opt.k) {
              <button (click)="state.setTweak('density', opt.k)"
                [style.background]="state.tweaks().density === opt.k ? 'var(--bg-elev)' : 'transparent'"
                [style.box-shadow]="state.tweaks().density === opt.k ? 'var(--shadow-xs)' : 'none'"
                style="padding:6px 8px;border-radius:5px;font-size:11px;font-weight:500">{{ opt.l }}</button>
            }
          </div>
        </div>
        <div>
          <div class="label">Primärfarbe</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            @for (c of colors; track c) {
              <button (click)="state.setTweak('primaryColor', c)"
                [style.background]="c"
                [style.border]="state.tweaks().primaryColor === c ? '2px solid var(--text)' : '2px solid transparent'"
                style="width:28px;height:28px;border-radius:6px;box-shadow:0 0 0 1px var(--border)"></button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TweaksPanelComponent {
  state = inject(AppStateService);
  close = output<void>();

  themes = [
    { k: 'light' as const, l: 'Hell' },
    { k: 'dark' as const, l: 'Dunkel' },
  ];

  densities = [
    { k: 'compact' as const, l: 'Kompakt' },
    { k: 'comfortable' as const, l: 'Normal' },
    { k: 'spacious' as const, l: 'Weit' },
  ];

  colors = PRIMARY_COLORS;
}
