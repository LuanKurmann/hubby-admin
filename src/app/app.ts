import { Component, inject, computed, HostListener, signal, effect } from '@angular/core';
import { AppStateService } from './core/services/app-state.service';
import { ToastService } from './core/services/toast.service';

// Layout
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { TopbarComponent } from './shared/components/topbar/topbar.component';

// Overlays
import { ToastComponent } from './shared/components/toast/toast.component';
import { CommandPaletteComponent } from './shared/components/command-palette/command-palette.component';
import { ShortcutsOverlayComponent } from './shared/components/shortcuts-overlay/shortcuts-overlay.component';
import { ClubSwitcherComponent } from './shared/components/club-switcher/club-switcher.component';
import { ProfileMenuComponent } from './shared/components/profile-menu/profile-menu.component';
import { NotificationsDropdownComponent } from './shared/components/notifications-dropdown/notifications-dropdown.component';
import { AddEventModalComponent } from './shared/components/add-event-modal/add-event-modal.component';
import { SkeletonComponent } from './shared/components/skeleton/skeleton.component';
import { TweaksPanelComponent } from './shared/components/tweaks-panel/tweaks-panel.component';
import { NewClubWizardComponent } from './shared/components/new-club-wizard/new-club-wizard.component';

// Auth
import { AuthRouterComponent } from './pages/auth/auth-router.component';

// Pages
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MembersComponent } from './pages/members/members.component';
import { MemberDrawerComponent } from './pages/members/member-drawer.component';
import { TeamsComponent } from './pages/teams/teams.component';
import { EventsComponent } from './pages/events/events.component';
import { EventDrawerComponent } from './pages/events/event-drawer.component';
import { NewsComponent } from './pages/news/news.component';
import { DuesComponent } from './pages/dues/dues.component';
import { RolesComponent } from './pages/roles/roles.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { InvitesComponent } from './pages/invites/invites.component';

const NAV_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  members: 'Mitglieder',
  invites: 'Einladungscodes',
  teams: 'Teams',
  events: 'Trainings & Matches',
  news: 'News & Berichte',
  dues: 'Beiträge',
  roles: 'Rollen & Rechte',
  settings: 'Einstellungen',
  profile: 'Mein Profil',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SidebarComponent, TopbarComponent,
    ToastComponent, CommandPaletteComponent, ShortcutsOverlayComponent,
    ClubSwitcherComponent, ProfileMenuComponent, NotificationsDropdownComponent,
    AddEventModalComponent,
    SkeletonComponent, TweaksPanelComponent,
    NewClubWizardComponent,
    AuthRouterComponent,
    DashboardComponent, MembersComponent, MemberDrawerComponent,
    TeamsComponent, EventsComponent, EventDrawerComponent,
    NewsComponent, DuesComponent, RolesComponent,
    SettingsComponent, ProfileComponent, InvitesComponent,
  ],
  template: `
    @if (!state.authenticated()) {
      <app-auth-router />
    } @else {
      <div style="display:flex;min-height:100vh;background:var(--bg)">
        <app-sidebar />
        <main style="flex:1;min-width:0;display:flex;flex-direction:column">
          <app-topbar [title]="pageTitle()" />
          @if (state.loading()) {
            <app-skeleton />
          } @else {
            <div class="fade-in" style="flex:1;min-height:0">
              @switch (state.page()) {
                @case ('dashboard') { <app-dashboard /> }
                @case ('members') { <app-members /> }
                @case ('invites') { <app-invites /> }
                @case ('teams') { <app-teams /> }
                @case ('events') { <app-events /> }
                @case ('news') { <app-news /> }
                @case ('dues') { <app-dues /> }
                @case ('roles') { <app-roles /> }
                @case ('settings') { <app-settings /> }
                @case ('profile') { <app-profile /> }
                @default { <app-dashboard /> }
              }
            </div>
          }
        </main>
      </div>

      <!-- Overlays -->
      <app-command-palette />
      <app-shortcuts-overlay />
      <app-club-switcher />
      <app-profile-menu />
      <app-notifications-dropdown />
      <app-member-drawer />
      <app-event-drawer />
      <app-add-event-modal />

      @if (tweaksOpen()) {
        <app-tweaks-panel (close)="tweaksOpen.set(false)" />
      }

      @if (state.newClubWizardOpen()) {
        <app-new-club-wizard [inAuthFlow]="false" />
      }
    }

    <app-toast />
  `,
})
export class App {
  state = inject(AppStateService);
  toast = inject(ToastService);

  tweaksOpen = signal<boolean>(false);

  pageTitle = computed(() => NAV_LABELS[this.state.page()] || 'Dashboard');

  constructor() {
    // Parent window tweaks bridge (for Claude Design edit mode)
    effect(() => {
      const handler = (e: MessageEvent) => {
        const data = e.data;
        if (data?.type === '__activate_edit_mode') this.tweaksOpen.set(true);
        if (data?.type === '__deactivate_edit_mode') this.tweaksOpen.set(false);
      };
      window.addEventListener('message', handler);
      try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
      return () => window.removeEventListener('message', handler);
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.state.authenticated()) return;
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
      const p = this.state.page();
      if (p === 'events') this.state.addEventOpen.set(true);
      else if (p === 'news') this.toast.show('News erstellen');
      else if (p === 'members' || p === 'invites') this.state.setPage('invites');
    }
  }
}
