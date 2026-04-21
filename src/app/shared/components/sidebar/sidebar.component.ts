import { Component, inject } from '@angular/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { IconComponent } from '../icon/icon.component';
import { AvatarComponent } from '../avatar/avatar.component';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'members', label: 'Mitglieder', icon: 'users' },
  { id: 'teams', label: 'Teams', icon: 'ball' },
  { id: 'events', label: 'Trainings & Matches', icon: 'calendar' },
  { id: 'news', label: 'News & Berichte', icon: 'news' },
  { id: 'dues', label: 'Beiträge', icon: 'money' },
  { id: 'roles', label: 'Rollen & Rechte', icon: 'shield' },
  { id: 'settings', label: 'Einstellungen', icon: 'settings' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [IconComponent, AvatarComponent],
  template: `
    <aside [style.width]="state.collapsed() ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)'"
      style="background:var(--bg-elev);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;transition:width .18s;flex-shrink:0;overflow:hidden">

      <!-- Club header -->
      <div [style.padding]="state.collapsed() ? '0' : '0 12px'"
        style="height:var(--topbar-h);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
        <button (click)="state.clubSwitcherOpen.set(true)"
          [style.padding]="state.collapsed() ? '0' : '6px 8px'"
          style="display:flex;align-items:center;gap:10px;border-radius:8px;flex:1;min-width:0"
          [style.justify-content]="state.collapsed() ? 'center' : 'flex-start'">
          <div [style.background]="state.club().color"
            style="width:28px;height:28px;border-radius:7px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;letter-spacing:-0.02em;flex-shrink:0">
            {{ state.club().logo }}
          </div>
          @if (!state.collapsed()) {
            <div style="text-align:left;min-width:0;flex:1">
              <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ state.club().name }}</div>
              <div style="font-size:11px;color:var(--text-muted)">{{ state.club().role }}</div>
            </div>
            <app-icon name="chevronDown" [size]="14" />
          }
        </button>
      </div>

      <!-- Navigation -->
      <nav style="flex:1;padding:8px;overflow-y:auto">
        @for (item of navItems; track item.id) {
          <button (click)="state.setPage(item.id)"
            [title]="state.collapsed() ? item.label : ''"
            [style.background]="state.page() === item.id ? 'var(--primary-subtle)' : 'transparent'"
            [style.color]="state.page() === item.id ? 'var(--primary)' : 'var(--text-secondary)'"
            [style.font-weight]="state.page() === item.id ? '600' : '500'"
            [style.padding]="state.collapsed() ? '0' : '0 10px'"
            [style.justify-content]="state.collapsed() ? 'center' : 'flex-start'"
            style="display:flex;align-items:center;gap:10px;width:100%;height:34px;border-radius:6px;font-size:13px;margin-bottom:2px;transition:background .1s"
            (mouseenter)="onHoverEnter($event, item.id)"
            (mouseleave)="onHoverLeave($event, item.id)">
            <app-icon [name]="item.icon" [size]="16" />
            @if (!state.collapsed()) { <span>{{ item.label }}</span> }
          </button>
        }
      </nav>

      <!-- Footer -->
      <div style="border-top:1px solid var(--border);padding:8px;position:relative">
        <button (click)="toggleProfileMenu()"
          [style.padding]="state.collapsed() ? '0' : '6px'"
          [style.justify-content]="state.collapsed() ? 'center' : 'flex-start'"
          style="display:flex;align-items:center;gap:10px;width:100%;border-radius:6px"
          (mouseenter)="hover($event, 'var(--bg-hover)')"
          (mouseleave)="hover($event, 'transparent')">
          <app-avatar [name]="state.user().name" size="sm" />
          @if (!state.collapsed()) {
            <div style="text-align:left;flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ state.user().name }}</div>
              <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ state.user().email }}</div>
            </div>
            <app-icon name="chevronDown" [size]="12" style="color:var(--text-muted);transform:rotate(180deg)" />
          }
        </button>
        <button (click)="state.collapsed.update(v => !v)"
          [style.padding]="state.collapsed() ? '0' : '0 10px'"
          [style.justify-content]="state.collapsed() ? 'center' : 'flex-start'"
          style="display:flex;align-items:center;gap:8px;width:100%;height:30px;border-radius:6px;color:var(--text-muted);font-size:12px;margin-top:4px"
          (mouseenter)="hover($event, 'var(--bg-hover)')"
          (mouseleave)="hover($event, 'transparent')">
          <app-icon name="menuCollapse" [size]="14" [style.transform]="state.collapsed() ? 'scaleX(-1)' : 'none'" />
          @if (!state.collapsed()) { <span>Einklappen</span> }
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  state = inject(AppStateService);
  navItems = NAV;

  toggleProfileMenu(): void {
    this.state.profileMenuAnchor.update(a => a === 'sidebar' ? null : 'sidebar');
  }

  onHoverEnter(e: MouseEvent, id: string): void {
    if (this.state.page() !== id) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
  }

  onHoverLeave(e: MouseEvent, id: string): void {
    if (this.state.page() !== id) (e.currentTarget as HTMLElement).style.background = 'transparent';
  }

  hover(e: Event, bg: string): void {
    (e.currentTarget as HTMLElement).style.background = bg;
  }
}
