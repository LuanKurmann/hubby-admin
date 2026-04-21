import { Component, inject, computed, effect, ElementRef, viewChild } from '@angular/core';
import { AppStateService } from '../../../core/services/app-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [IconComponent, AvatarComponent],
  template: `
    @if (state.profileMenuAnchor()) {
      <div #menu [style]="positionStyle()"
        style="background:var(--bg-elev);border:1px solid var(--border);border-radius:10px;box-shadow:var(--shadow-xl);z-index:95;animation:slideInUp .12s ease-out;overflow:hidden">

        <div style="padding:14px 14px 12px;background:linear-gradient(180deg, var(--bg-subtle) 0%, transparent 100%);border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px">
            <app-avatar [name]="state.user().name" size="md" />
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ state.user().name }}</div>
              <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ state.user().email }}</div>
            </div>
          </div>
        </div>

        <div style="padding:4px">
          <button class="pm-item" (click)="goto('profile')"
            (mouseenter)="hoverBg($event, 'var(--bg-subtle)')"
            (mouseleave)="hoverBg($event, 'transparent')">
            <app-icon name="user" [size]="14" style="color:var(--text-muted)" />
            <span style="flex:1">Mein Profil</span>
          </button>
          <button class="pm-item" (click)="goto('settings')"
            (mouseenter)="hoverBg($event, 'var(--bg-subtle)')"
            (mouseleave)="hoverBg($event, 'transparent')">
            <app-icon name="settings" [size]="14" style="color:var(--text-muted)" />
            <span style="flex:1">Einstellungen</span>
          </button>
          <button class="pm-item" (click)="close(); toast.show('Benachrichtigungen geöffnet')"
            (mouseenter)="hoverBg($event, 'var(--bg-subtle)')"
            (mouseleave)="hoverBg($event, 'transparent')">
            <app-icon name="bell" [size]="14" style="color:var(--text-muted)" />
            <span style="flex:1">Benachrichtigungen</span>
            <span class="badge" style="background:var(--primary);color:#fff;border:0">3 neu</span>
          </button>

          <div class="divider" style="margin:4px 6px"></div>

          <!-- Theme toggle -->
          <div style="padding:6px 10px;display:flex;align-items:center;gap:10px">
            <app-icon name="sun" [size]="14" style="color:var(--text-muted)" />
            <div style="font-size:13px;flex:1">Darstellung</div>
            <div style="display:flex;gap:0;background:var(--bg-subtle);border-radius:6px;padding:2px">
              @for (opt of themeOptions; track opt.k) {
                <button (click)="state.setTweak('theme', opt.k)"
                  [style.background]="state.tweaks().theme === opt.k ? 'var(--bg-elev)' : 'transparent'"
                  [style.box-shadow]="state.tweaks().theme === opt.k ? 'var(--shadow-xs)' : 'none'"
                  style="width:26px;height:22px;border-radius:4px;font-size:11px">{{ opt.l }}</button>
              }
            </div>
          </div>

          <div class="divider" style="margin:4px 6px"></div>

          <button class="pm-item" (click)="close(); toast.show('Support-Zentrum')"
            (mouseenter)="hoverBg($event, 'var(--bg-subtle)')"
            (mouseleave)="hoverBg($event, 'transparent')">
            <app-icon name="help" [size]="14" style="color:var(--text-muted)" />
            <span style="flex:1">Hilfe & Support</span>
          </button>
          <button class="pm-item" (click)="openShortcuts()"
            (mouseenter)="hoverBg($event, 'var(--bg-subtle)')"
            (mouseleave)="hoverBg($event, 'transparent')">
            <app-icon name="keyboard" [size]="14" style="color:var(--text-muted)" />
            <span style="flex:1">Tastatur-Shortcuts</span>
            <span class="kbd">?</span>
          </button>

          <div class="divider" style="margin:4px 6px"></div>

          <button class="pm-item" (click)="logout()" [style.color]="'var(--danger)'"
            (mouseenter)="hoverBg($event, 'var(--danger-bg)')"
            (mouseleave)="hoverBg($event, 'transparent')">
            <app-icon name="logout" [size]="14" style="color:var(--danger)" />
            <span style="flex:1">Abmelden</span>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .pm-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      border-radius: 6px;
      color: var(--text);
      text-align: left;
      font-size: 13px;
    }
  `]
})
export class ProfileMenuComponent {
  state = inject(AppStateService);
  toast = inject(ToastService);

  menu = viewChild<ElementRef<HTMLDivElement>>('menu');

  themeOptions = [
    { k: 'light' as const, l: '☀' },
    { k: 'dark' as const, l: '🌙' },
  ];

  positionStyle = computed(() => {
    const anchor = this.state.profileMenuAnchor();
    if (anchor === 'topbar') {
      return 'position:fixed;top:52px;right:16px;width:260px';
    }
    return 'position:fixed;bottom:70px;left:12px;width:240px';
  });

  constructor() {
    effect((onCleanup) => {
      if (!this.state.profileMenuAnchor()) return;
      const onMouse = (e: MouseEvent) => {
        const el = this.menu()?.nativeElement;
        const target = e.target as Node;
        if (el && !el.contains(target)) {
          // Don't close if clicking on the trigger button again
          const triggers = document.querySelectorAll('[data-pm-trigger]');
          let isTrigger = false;
          triggers.forEach(t => { if (t.contains(target)) isTrigger = true; });
          if (!isTrigger) this.close();
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.close();
      };
      const id = setTimeout(() => document.addEventListener('mousedown', onMouse), 0);
      document.addEventListener('keydown', onKey);
      onCleanup(() => {
        clearTimeout(id);
        document.removeEventListener('mousedown', onMouse);
        document.removeEventListener('keydown', onKey);
      });
    });
  }

  close(): void { this.state.profileMenuAnchor.set(null); }

  goto(page: string): void {
    this.state.setPage(page);
    this.close();
  }

  logout(): void {
    this.state.authenticated.set(false);
    this.state.authView.set('login');
    this.toast.show({ kind: 'success', body: 'Erfolgreich abgemeldet' });
    this.close();
  }

  openShortcuts(): void {
    this.state.shortcutsOpen.set(true);
    this.close();
  }

  hoverBg(e: Event, bg: string): void {
    (e.currentTarget as HTMLElement).style.background = bg;
  }
}
