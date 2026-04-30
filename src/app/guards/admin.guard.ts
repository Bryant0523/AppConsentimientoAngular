import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AjustesService } from '../services/ajustes';

export const adminGuard: CanActivateFn = () => {
  const ajustesService = inject(AjustesService);
  const router = inject(Router);

  if (ajustesService.estaAutenticado()) {
    return true;
  }

  // Redirige a ajustes para que ingrese la clave
  router.navigate(['/ajustes'], { queryParams: { redirect: 'admin' } });
  return false;
};