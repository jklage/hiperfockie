
import { Routes } from '@angular/router';
import { soloUsuario, soloVisitante } from './core/guardias';

const t = (titulo: string) => `${titulo} · Hiperfockie`;

export const routes: Routes = [

  { path: '', title: 'Hiperfockie', canActivate: [soloVisitante], loadComponent: () => import('./paginas/inicio/inicio').then((m) => m.Inicio) },
  { path: 'login', title: t('Inicia sesión'), canActivate: [soloVisitante], loadComponent: () => import('./paginas/login/login').then((m) => m.Login) },
  { path: 'registro', title: t('Crear cuenta'), canActivate: [soloVisitante], loadComponent: () => import('./paginas/registro/registro').then((m) => m.Registro) },
  { path: 'recuperar', title: t('Recuperar contraseña'), loadComponent: () => import('./paginas/recuperar/recuperar').then((m) => m.Recuperar) },
  { path: 'restablecer', title: t('Nueva contraseña'), loadComponent: () => import('./paginas/restablecer/restablecer').then((m) => m.Restablecer) },
  { path: 'aviso-privacidad', title: t('Aviso de privacidad'), loadComponent: () => import('./paginas/aviso/aviso').then((m) => m.Aviso) },

  { path: 'explorar', title: t('Explorar'), canActivate: [soloUsuario], loadComponent: () => import('./paginas/explorar/explorar').then((m) => m.Explorar) },
  { path: 'focos', title: t('Mis focos'), canActivate: [soloUsuario], loadComponent: () => import('./paginas/focos/focos').then((m) => m.Focos) },
  { path: 'focos/:id/madriguera', title: t('Madriguera'), canActivate: [soloUsuario], loadComponent: () => import('./paginas/madriguera/madriguera').then((m) => m.Madriguera) },
  { path: 'focos/:id/historial', title: t('Historial'), canActivate: [soloUsuario], loadComponent: () => import('./paginas/historial/historial').then((m) => m.HistorialPagina) },
  { path: 'historial', title: t('Historial'), canActivate: [soloUsuario], loadComponent: () => import('./paginas/historial/historial').then((m) => m.HistorialPagina) },
  { path: 'donar', title: t('Donar'), canActivate: [soloUsuario], loadComponent: () => import('./paginas/donar/donar').then((m) => m.Donar) },

  { path: 'sin-acceso', title: t('Sin acceso'), data: { motivo: 'sesion' }, loadComponent: () => import('./paginas/no-encontrada/no-encontrada').then((m) => m.NoEncontrada) },
  { path: '**', title: t('No encontrada'), loadComponent: () => import('./paginas/no-encontrada/no-encontrada').then((m) => m.NoEncontrada) },
];
