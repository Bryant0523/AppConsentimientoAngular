import { CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = () => {

  if (typeof window !== 'undefined') {

    const autorizado = localStorage.getItem('admin');

    if (autorizado === 'true') {
      return true;
    }

  }

  alert('Acceso restringido');
  return false;
};