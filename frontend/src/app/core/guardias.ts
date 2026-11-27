//bloquea las pantallas privadas y de registro, para que solo puedan acceder los usuarios que cumplan con los requisitos
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion.service';

export const soloUsuario: CanActivateFn = (_r, estado) =>
  inject(SesionService).activa() ||
  inject(Router).createUrlTree(['/sin-acceso'], { queryParams: { volver: estado.url } });

export const soloVisitante: CanActivateFn = () =>
  !inject(SesionService).activa() || inject(Router).createUrlTree(['/explorar']);
