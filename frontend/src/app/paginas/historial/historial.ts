
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Api, ErrorApi } from '../../core/api.service';
import { Foco, Historial, NOMBRE_FUENTE, Vineta } from '../../core/modelos';
import { dos, fechaCorta, hora } from '../../core/formato';

const DIBUJOS = [
  '<ellipse cx="50" cy="40" rx="26" ry="24" fill="#1D1B16"/><ellipse cx="50" cy="40" rx="40" ry="11" fill="none" stroke="#E4572E" stroke-width="3"/>',
  '<circle cx="50" cy="40" r="28" fill="none" stroke="#1D1B16" stroke-width="3"/><path d="M50 40V22M50 40l12 8" stroke="#E4572E" stroke-width="3" stroke-linecap="round"/>',
  '<circle cx="50" cy="40" r="16" fill="#1D1B16"/><g stroke="#E4572E" stroke-width="3" stroke-linecap="round"><path d="M50 10v8M50 62v8M20 40h8M72 40h8M29 19l6 6M65 55l6 6M71 19l-6 6M35 55l-6 6"/></g>',
  '<ellipse cx="50" cy="44" rx="36" ry="18" fill="none" stroke="#1D1B16" stroke-width="3"/><ellipse cx="50" cy="44" rx="12" ry="9" fill="#1D1B16"/><path d="M14 18l22 18" stroke="#E4572E" stroke-width="3"/><path d="M30 34l6 2-2-6" fill="none" stroke="#E4572E" stroke-width="3"/>',
  '<path d="M22 20h24c4 0 4 4 4 4v40s0-4-4-4H22zM78 20H54c-4 0-4 4-4 4v40s0-4 4-4h24z" fill="none" stroke="#1D1B16" stroke-width="3" stroke-linejoin="round"/><path d="M28 30h14M28 38h14M58 30h14" stroke="#E4572E" stroke-width="2.5"/>',
  '<circle cx="50" cy="40" r="6" fill="#E4572E"/><g fill="none" stroke="#1D1B16" stroke-width="2.5"><ellipse cx="50" cy="40" rx="34" ry="12"/><ellipse cx="50" cy="40" rx="34" ry="12" transform="rotate(60 50 40)"/><ellipse cx="50" cy="40" rx="34" ry="12" transform="rotate(-60 50 40)"/></g>',
];

@Component({
  selector: 'app-historial',
  imports: [RouterLink, FormsModule],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
})
export class HistorialPagina {
  id = input<string>();
  private api = inject(Api);
  private router = inject(Router);
  private limpio = inject(DomSanitizer);
  private svgs: SafeHtml[] = DIBUJOS.map((d) =>
    this.limpio.bypassSecurityTrustHtml(`<svg viewBox="0 0 100 80" width="100" height="80" aria-hidden="true">${d}</svg>`));
  focos = signal<Foco[]>([]);
  datos = signal<Historial | null>(null);
  error = signal('');
  sinFocos = signal(false);
  nombre = NOMBRE_FUENTE;
  dos = dos; hora = hora; fechaCorta = fechaCorta;

  elegido = computed(() => this.datos()?.foco.id ?? null);

  constructor() {
    effect(() => { this.cargar(this.id()); });
  }

  private async cargar(id?: string) {
    this.error.set('');
    try {
      const lista = (await this.api.focos()).datos;
      this.focos.set(lista);
      const focoId = id ? Number(id) : lista[0]?.id;
      if (!focoId) { this.sinFocos.set(true); return; }
      this.datos.set((await this.api.historial(focoId)).datos);
    } catch (e) {
      this.error.set(e instanceof ErrorApi ? e.message : 'No se pudo cargar el historial');
    }
  }

  cambiarFoco(id: number) { this.router.navigate(['/focos', id, 'historial']); }

  dibujo(i: number) { return this.svgs[i % this.svgs.length]; }

  globo(v: Vineta): string {
    if (v.primeraNota) return recortar(v.primeraNota, 70);
    if (v.accion === 'crear_foco') return 'Todo empezó con una pregunta.';
    if (v.accion === 'regresar') return 'De vuelta a un tema conocido.';
    return recortar((v.resumen ?? v.titulo).split(/(?<=\.)\s/)[0], 70);
  }

  irA(orden: number) { document.getElementById(`v${orden}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}

function recortar(s: string, n: number) { return s.length > n ? s.slice(0, n).replace(/\s\S*$/, '') + '…' : s; }
