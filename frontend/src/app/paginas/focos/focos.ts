
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api, ErrorApi } from '../../core/api.service';
import { AvisosService } from '../../core/avisos.service';
import { Foco } from '../../core/modelos';
import { dos, fechaCorta, hace } from '../../core/formato';

@Component({
  selector: 'app-focos',
  imports: [RouterLink],
  template: `
    <section class="contenedor pagina">
      <header class="encabezado">
        <h1 class="titulo">Mis focos</h1>
        <div class="contador">
          <span class="puntos" aria-hidden="true">@for (i of cinco; track i) { <i [class.lleno]="i < activos().length"></i> }</span>
          <span class="tec">{{ activos().length }} de 5 focos activos</span>
        </div>
      </header>

      @if (cargando()) { <p class="suave">Cargando…</p> }
      @else {
        <div class="rejilla">
          @for (f of activos(); track f.id; let i = $index) {
            <article class="panel foco">
              <div class="linea">
                <span class="etiqueta">Foco {{ dos(i + 1) }} · Nivel {{ f.nivelMaximo }}/5</span>
                <span class="niveles" aria-hidden="true">@for (n of cinco; track n) { <i [class.lleno]="n < f.nivelMaximo"></i> }</span>
              </div>
              <h2>{{ f.tema }}</h2>
              <p class="suave meta">{{ f.temasVisitados }} {{ f.temasVisitados === 1 ? 'tema' : 'temas' }} · {{ f.notas }} {{ f.notas === 1 ? 'nota' : 'notas' }} · {{ hace(f.creadoEn) }}</p>
              <div class="acciones">
                <a class="btn btn-tinta btn-chico" [routerLink]="['/focos', f.id, 'madriguera']">Abrir</a>
                <a class="btn btn-chico" [routerLink]="['/focos', f.id, 'historial']">Historial</a>
                <button class="btn btn-chico" (click)="cambiar(f, 'archivado')" [disabled]="ocupado()">Archivar</button>
              </div>
            </article>
          }
          @for (l of libres(); track l) {
            <a class="panel-papel libre" routerLink="/explorar">
              <b>Espacio libre</b>
              <span class="suave">Escribe una pregunta en Explorar y conviértela en foco.</span>
            </a>
          }
          @if (archivados().length) {
            <aside class="panel archivados">
              <h2>Archivados ({{ archivados().length }})</h2>
              @for (f of archivados(); track f.id) {
                <div class="archivado">
                  <p>{{ f.tema }}</p>
                  <p class="tec">archivado · creado el {{ fechaCorta(f.creadoEn) }} · {{ f.temasVisitados }} {{ f.temasVisitados === 1 ? 'tema' : 'temas' }}</p>
                  <div class="acciones">
                    <button class="btn btn-chico" (click)="cambiar(f, 'activo')" [disabled]="ocupado()">Reactivar</button>
                    <a class="btn btn-chico" [routerLink]="['/focos', f.id, 'madriguera']">Ver</a>
                  </div>
                </div>
              }
            </aside>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .encabezado { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px; }
    .contador { display: flex; align-items: center; gap: 16px; }
    .rejilla { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .foco { display: grid; gap: 8px; align-content: start; padding: 18px; }
    .linea { display: flex; justify-content: space-between; align-items: center; }
    .niveles { display: inline-flex; gap: 3px; }
    .niveles i { width: 12px; height: 12px; border: 1.5px solid var(--tinta); display: block; }
    .niveles i.lleno { background: var(--tinta); }
    h2 { font-size: 1.1rem; }
    .meta { font-size: 14px; }
    .acciones { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
    .libre { display: grid; place-content: center; text-align: center; gap: 6px; min-height: 170px; color: var(--tinta); text-decoration: none; font-size: 14px; }
    .libre b { font-size: 1.1rem; font-weight: 600; color: var(--tinta-2); }
    .libre:hover { border-color: var(--naranja); text-decoration: none; }
    .archivados { background: var(--papel-2); display: grid; gap: 12px; align-content: start; padding: 18px; }
    .archivado { display: grid; gap: 4px; border-top: 1px solid var(--borde); padding-top: 10px; }
    @media (max-width: 1023px) { .rejilla { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 767px) { .rejilla { grid-template-columns: 1fr; } }
  `,
})
export class Focos implements OnInit {
  private api = inject(Api);
  private avisos = inject(AvisosService);
  lista = signal<Foco[]>([]);
  cargando = signal(true);
  ocupado = signal(false);
  activos = computed(() => this.lista().filter((f) => f.estado === 'activo'));
  archivados = computed(() => this.lista().filter((f) => f.estado === 'archivado'));
  libres = computed(() => Array.from({ length: Math.max(0, 5 - this.activos().length) }, (_, i) => i));
  cinco = [0, 1, 2, 3, 4];
  dos = dos;
  hace = hace;
  fechaCorta = fechaCorta;

  async ngOnInit() { await this.cargar(); }

  private async cargar() {
    try { this.lista.set((await this.api.focos()).datos); }
    finally { this.cargando.set(false); }
  }

  async cambiar(f: Foco, estado: 'activo' | 'archivado') {
    this.ocupado.set(true);
    try {
      await this.api.estadoFoco(f.id, estado);
      await this.cargar();
      this.avisos.ok(estado === 'archivado' ? `Foco archivado. Ahora tienes ${this.activos().length} de 5.` : 'Foco reactivado.');
    } catch (e) {
      this.avisos.error(e instanceof ErrorApi ? e.message : 'No se pudo actualizar el foco');
    } finally {
      this.ocupado.set(false);
    }
  }
}
