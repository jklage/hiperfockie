
import { Injectable, computed, signal } from '@angular/core';
import { Sesion, Usuario } from './modelos';

const CLAVE = 'hf.sesion';

function leer(): Sesion | null {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Sesion | null;
    if (!s?.token) return null;
    const { exp } = JSON.parse(atob(s.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return exp * 1000 > Date.now() ? s : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class SesionService {
  private estado = signal<Sesion | null>(leer());
  readonly usuario = computed<Usuario | null>(() => this.estado()?.usuario ?? null);
  readonly activa = computed(() => this.estado() !== null);
  readonly inicial = computed(() => (this.usuario()?.nombre ?? '?').trim().charAt(0).toUpperCase());
  readonly primerNombre = computed(() => (this.usuario()?.nombre ?? '').split(' ')[0]);

  token(): string | null {
    const s = this.estado();
    if (s && !leer()) { this.cerrar(); return null; }
    return s?.token ?? null;
  }

  iniciar(s: Sesion) {
    try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch {  }
    this.estado.set(s);
  }

  cerrar() {
    try { localStorage.removeItem(CLAVE); } catch {  }
    this.estado.set(null);
  }
}
