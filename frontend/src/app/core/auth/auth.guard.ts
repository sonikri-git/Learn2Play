import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenStorage } from './token-storage';

export const canActivateAuth: CanActivateFn = () => {
  const router = inject(Router);
  if (TokenStorage.get()) return true;
  router.navigateByUrl('/login');
  return false;
};
