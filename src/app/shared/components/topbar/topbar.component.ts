import { Component, inject, input } from '@angular/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { IconComponent } from '../icon/icon.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { TPipe } from '../../pipes/t.pipe';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [IconComponent, AvatarComponent, TPipe],
  template: `
    <header style="height:var(--topbar-h);display:flex;align-items:center;gap:12px;padding:0 16px 0 10px;border-bottom:1px solid var(--border);background:var(--bg-elev);position:sticky;top:0;z-index:20">
      <!-- Sidebar toggle (desktop collapse OR mobile open) -->
      <button (click)="onToggleSidebar()"
        [title]="(state.collapsed() ? 'topbar.toggleSidebarOpen' : 'topbar.toggleSidebarClose') | t"
        class="btn btn-ghost btn-icon"
        style="flex-shrink:0">
        <app-icon [name]="state.collapsed() ? 'menu' : 'menuCollapse'" [size]="16" />
      </button>

      <div style="font-size:14px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ title() }}</div>
      <div style="flex:1"></div>

      <!-- Search - full on desktop, icon-only on mobile -->
      <button (click)="state.cmdOpen.set(true)"
        class="topbar-search"
        data-tour="topbar-search"
        style="display:flex;align-items:center;gap:8px;height:32px;padding:0 10px 0 8px;border-radius:6px;background:var(--bg-subtle);border:1px solid var(--border);color:var(--text-muted);font-size:12px;min-width:260px">
        <app-icon name="search" [size]="14" />
        <span class="hide-sm-down">{{ 'topbar.search' | t }}</span>
        <div style="flex:1" class="hide-sm-down"></div>
        <span class="kbd hide-sm-down">⌘</span><span class="kbd hide-sm-down">K</span>
      </button>

      <!-- Notifications -->
      <button (click)="state.notifOpen.update(v => !v)" class="btn btn-ghost btn-icon" style="position:relative">
        <app-icon name="bell" [size]="16" />
        @if (state.notifications() > 0) {
          <span style="position:absolute;top:4px;right:4px;width:14px;height:14px;border-radius:50%;background:var(--primary);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg-elev)">
            {{ state.notifications() }}
          </span>
        }
      </button>

      <!-- Profile avatar -->
      <button (click)="state.profileMenuAnchor.update(a => a === 'topbar' ? null : 'topbar')"
        [style.background]="state.profileMenuAnchor() === 'topbar' ? 'var(--bg-subtle)' : 'transparent'"
        style="display:flex;align-items:center;gap:6px;padding:3px 3px 3px 8px;border-radius:var(--r-full)"
        (mouseenter)="hover($event, 'var(--bg-subtle)')"
        (mouseleave)="hover($event, state.profileMenuAnchor() === 'topbar' ? 'var(--bg-subtle)' : 'transparent')">
        <app-avatar [name]="state.user().name" size="sm" />
        <app-icon name="chevronDown" [size]="12" style="color:var(--text-muted)" />
      </button>
    </header>
  `,
})
export class TopbarComponent {
  state = inject(AppStateService);
  title = input<string>('');

  onToggleSidebar(): void {
    // On mobile (<=900px): toggle mobile drawer instead of desktop collapse
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      this.state.mobileSidebarOpen.update(v => !v);
    } else {
      this.state.collapsed.update(v => !v);
    }
  }

  hover(e: Event, bg: string): void {
    (e.currentTarget as HTMLElement).style.background = bg;
  }
}
