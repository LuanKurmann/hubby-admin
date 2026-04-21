import { Component, inject, signal, computed, HostListener, effect } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AppStateService } from '../../../core/services/app-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/i18n/i18n.service';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastComponent } from '../toast/toast.component';
import { CommandPaletteComponent } from '../command-palette/command-palette.component';
import { ShortcutsOverlayComponent } from '../shortcuts-overlay/shortcuts-overlay.component';
import { ClubSwitcherComponent } from '../club-switcher/club-switcher.component';
import { ProfileMenuComponent } from '../profile-menu/profile-menu.component';
import { NotificationsDropdownComponent } from '../notifications-dropdown/notifications-dropdown.component';
import { AddEventModalComponent } from '../add-event-modal/add-event-modal.component';
import { NewClubWizardComponent } from '../new-club-wizard/new-club-wizard.component';
import { TweaksPanelComponent } from '../tweaks-panel/tweaks-panel.component';
import { OnboardingTourComponent } from '../onboarding-tour/onboarding-tour.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent, TopbarComponent,
    CommandPaletteComponent, ShortcutsOverlayComponent,
    ClubSwitcherComponent, ProfileMenuComponent, NotificationsDropdownComponent,
    AddEventModalComponent, NewClubWizardComponent, TweaksPanelComponent,
    OnboardingTourComponent,
  ],
  template: `
    <div style="display:flex;min-height:100vh;background:var(--bg);position:relative">
      <app-sidebar />
      @if (state.mobileSidebarOpen()) {
        <div class="mobile-backdrop" (click)="state.mobileSidebarOpen.set(false)"></div>
      }
      <main style="flex:1;min-width:0;display:flex;flex-direction:column">
        <app-topbar [title]="pageTitle()" />
        <div class="fade-in" style="flex:1;min-height:0">
          <router-outlet />
        </div>
      </main>
    </div>

    <app-command-palette />
    <app-shortcuts-overlay />
    <app-club-switcher />
    <app-profile-menu />
    <app-notifications-dropdown />
    <app-add-event-modal />

    @if (state.newClubWizardOpen()) {
      <app-new-club-wizard [inAuthFlow]="false" />
    }

    @if (tweaksOpen()) {
      <app-tweaks-panel (close)="tweaksOpen.set(false)" />
    }

    <app-onboarding-tour />
  `,
})
export class AppLayoutComponent {
  state = inject(AppStateService);
  toast = inject(ToastService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  i18n = inject(I18nService);

  tweaksOpen = signal<boolean>(false);
  pageTitle = signal<string>('');

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        let r = this.route;
        while (r.firstChild) r = r.firstChild;
        const id = r.snapshot.url[0]?.path;
        if (id) this.pageTitle.set(this.i18n.t('nav.' + id));
      });

    // Re-resolve title when locale changes
    effect(() => {
      this.i18n.locale();
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      const id = r.snapshot.url[0]?.path;
      if (id) this.pageTitle.set(this.i18n.t('nav.' + id));
    });

    effect((onCleanup) => {
      const handler = (e: MessageEvent) => {
        const data = e.data;
        if (data?.type === '__activate_edit_mode') this.tweaksOpen.set(true);
        if (data?.type === '__deactivate_edit_mode') this.tweaksOpen.set(false);
      };
      window.addEventListener('message', handler);
      try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
      onCleanup(() => window.removeEventListener('message', handler));
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    const tag = target.tagName?.toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea' || target.isContentEditable;

    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.state.cmdOpen.set(true);
      return;
    }
    if (isInput) return;

    if (e.key === '/') {
      e.preventDefault();
      this.state.cmdOpen.set(true);
    } else if (e.key === '?') {
      this.state.shortcutsOpen.set(true);
    } else if (e.key === 'n' || e.key === 'N') {
      const url = this.router.url;
      if (url.startsWith('/events')) this.state.addEventOpen.set(true);
      else if (url.startsWith('/news')) this.toast.show('News erstellen');
      else if (url.startsWith('/members') || url.startsWith('/invites')) this.router.navigate(['/invites']);
    }
  }
}
