
import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; texto: string; tipo: 'ok' | 'error'; }

@Injectable({ providedIn: 'root' })
export class AvisosService {
  readonly lista = signal<Toast[]>([]);
  private n = 0;

  ok(texto: string) { this.mostrar(texto, 'ok'); }
  error(texto: string) { this.mostrar(texto, 'error'); }

  private mostrar(texto: string, tipo: Toast['tipo']) {
    const id = ++this.n;
    this.lista.update((l) => [...l, { id, texto, tipo }]);
    setTimeout(() => this.lista.update((l) => l.filter((t) => t.id !== id)), 3500);
  }
}
