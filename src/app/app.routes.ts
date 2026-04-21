import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { AppLayoutComponent } from './shared/components/app-layout/app-layout.component';

export const routes: Routes = [
  // Auth flow (no shell)
  {
    path: '',
    canMatch: [guestGuard],
    loadComponent: () => import('./pages/auth/auth-router.component').then(m => m.AuthRouterComponent),
  },

  // Authenticated app
  {
    path: '',
    canMatch: [authGuard],
    component: AppLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        data: { title: 'Dashboard' },
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'members',
        data: { title: 'Mitglieder' },
        loadComponent: () => import('./pages/members/members.component').then(m => m.MembersComponent),
      },
      {
        path: 'invites',
        data: { title: 'Einladungscodes' },
        loadComponent: () => import('./pages/invites/invites.component').then(m => m.InvitesComponent),
      },
      {
        path: 'teams',
        data: { title: 'Teams' },
        loadComponent: () => import('./pages/teams/teams.component').then(m => m.TeamsComponent),
      },
      {
        path: 'events',
        data: { title: 'Trainings & Matches' },
        loadComponent: () => import('./pages/events/events.component').then(m => m.EventsComponent),
      },
      {
        path: 'news',
        data: { title: 'News & Berichte' },
        loadComponent: () => import('./pages/news/news.component').then(m => m.NewsComponent),
      },
      {
        path: 'dues',
        data: { title: 'Beiträge' },
        loadComponent: () => import('./pages/dues/dues.component').then(m => m.DuesComponent),
      },
      {
        path: 'roles',
        data: { title: 'Rollen & Rechte' },
        loadComponent: () => import('./pages/roles/roles.component').then(m => m.RolesComponent),
      },
      {
        path: 'settings',
        data: { title: 'Einstellungen' },
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'profile',
        data: { title: 'Mein Profil' },
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];

