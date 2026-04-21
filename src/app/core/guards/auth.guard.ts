import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';

export const authGuard: CanMatchFn = () => {
  const state = inject(AppStateService);
  const router = inject(Router);
  if (state.authenticated()) return true;
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanMatchFn = () => {
  const state = inject(AppStateService);
  const router = inject(Router);
  if (!state.authenticated()) return true;
  return router.createUrlTree(['/dashboard']);
};
