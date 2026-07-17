// budget: 400 lines
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Guards ADMIN-only routes. Unauthenticated users go to /login, non-admin
// authenticated users are redirected to /today.
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  if (!auth.isAdmin()) {
    return router.createUrlTree(['/today']);
  }
  return true;
};
