import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AppStateService } from '../services/app-state.service';

/**
 * Guards return only boolean — never UrlTree.
 * A UrlTree from canMatch triggers a new navigation, which re-runs the guard,
 * which triggers another navigation → infinite loop.
 *
 * Instead we rely on the route order + wildcard fallback:
 *   - guestGuard=true  matches unauthenticated users on AuthRouter
 *   - authGuard=true   matches authenticated users on AppLayout (with children)
 *   - wildcard '**'    redirects to '' so the correct route takes over
 */
export const authGuard: CanMatchFn = () => {
  return inject(AppStateService).authenticated();
};

export const guestGuard: CanMatchFn = () => {
  return !inject(AppStateService).authenticated();
};
