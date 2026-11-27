
import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Tarjeta } from '../../core/modelos';
import { dominio } from '../../core/formato';

@Component({
  selector: 'app-tarjeta',
  imports: [DecimalPipe],
  template: `
    <article class="tarjeta" [class]="'borde-' + t().fuente">
      @if (t().portada && t().fuente === 'openlibrary') {
        <img class="portada" [src]="t().portada" [alt]="'Portada de ' + t().titulo" loading="lazy" />
      }
      <h3>{{ t().titulo }}</h3>
      <p class="tec meta">{{ meta() }}</p>
      @if (t().resumen) { <p class="resumen">{{ t().resumen }}</p> }
      <a class="fuente-link" [href]="t().url" target="_blank" rel="noopener">Ver en la fuente ↗</a>
      <div class="pie">
        <span class="chip" [title]="'0.5·R ' + (t().relevancia | number: '1.2-2') + ' + 0.3·C ' + (t().confiabilidad | number: '1.2-2') + ' + 0.2·N ' + t().novedad">
          Puntaje <b>{{ t().puntaje | number: '1.2-2' }}</b>
        </span>
        <ng-content />
      </div>
    </article>
  `,
  styles: `
    .tarjeta { background: var(--blanco); border: 1.5px solid var(--borde); border-left-width: 6px; border-radius: 12px; padding: 18px 18px 16px; display: grid; gap: 6px; align-content: start; }
    .borde-wikipedia { border-left-color: var(--wikipedia); }
    .borde-openalex { border-left-color: var(--openalex); }
    .borde-openlibrary { border-left-color: var(--openlibrary); }
    h3 { font-size: 1.1rem; }
    .meta { overflow-wrap: anywhere; }
    .resumen { font-size: 15px; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
    .portada { float: right; width: 56px; margin-left: 12px; border-radius: 4px; border: 1px solid var(--borde); }
    .fuente-link { font-weight: 600; font-size: 14px; }
    .pie { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 4px; }
    .chip { border: 1.5px solid var(--borde); border-radius: 8px; padding: 4px 12px; font-size: 13px; }
  `,
})
export class TarjetaComp {
  t = input.required<Tarjeta>({ alias: 'tarjeta' });
  meta = computed(() => {
    const t = this.t();
    if (t.fuente === 'wikipedia') return `${dominio(t.url)} · ${t.licencia}`;
    const partes = [t.autores.slice(0, 2).join(', ') || null, t.anio, t.licencia].filter(Boolean);
    return partes.join(' · ');
  });
}
