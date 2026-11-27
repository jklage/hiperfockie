
import { Component, computed, inject, input, signal, effect, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api, ErrorApi } from '../../core/api.service';
import { AvisosService } from '../../core/avisos.service';
import { Fuente, NOMBRE_FUENTE, ResultadoBusqueda, Tarjeta } from '../../core/modelos';
import { dos } from '../../core/formato';
import { TarjetaComp } from '../../componentes/tarjeta/tarjeta';
import { Limite } from '../../componentes/limite/limite';

@Component({
  selector: 'app-explorar',
  imports: [FormsModule, DecimalPipe, TarjetaComp, Limite],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css',
})
export class Explorar {
  q = input<string>();
  private api = inject(Api);
  private router = inject(Router);
  private avisos = inject(AvisosService);

  texto = '';
  cargando = signal(false);
  error = signal('');
  resultado = signal<ResultadoBusqueda | null>(null);
  segundos = signal(0);
  filtro = signal<Fuente | 'todas'>('todas');
  creando = signal(false);
  limite = signal(false);
  fuentes: Fuente[] = ['wikipedia', 'openalex', 'openlibrary'];
  nombre = NOMBRE_FUENTE;
  dos = dos;

  porFuente = computed(() => {
    const r = this.resultado();
    const m: Record<Fuente, Tarjeta[]> = { wikipedia: [], openalex: [], openlibrary: [] };
    for (const t of r?.tarjetas ?? []) m[t.fuente].push(t);
    return m;
  });
  caidas = computed(() => new Set((this.resultado()?.avisos ?? []).map((a) => a.fuente)));
  sugeridos = computed(() => [...(this.resultado()?.tarjetas ?? [])].sort((a, b) => b.puntaje - a.puntaje).slice(0, 5));

  constructor() {
    effect(() => {
      const q = this.q();
      if (q && q !== untracked(() => this.resultado()?.pregunta)) {
        this.texto = q;
        untracked(() => this.ejecutar(q));
      }
    });
  }

  buscar() {
    const t = this.texto.trim();
    if (t.length < 3 || t.length > 200) { this.error.set('La pregunta debe tener entre 3 y 200 caracteres'); return; }
    this.router.navigate([], { queryParams: { q: t } });
    if (t === this.q()) this.ejecutar(t);
  }

  private async ejecutar(q: string) {
    this.cargando.set(true);
    this.error.set('');
    const inicio = performance.now();
    try {
      const r = await this.api.buscar(q);
      this.resultado.set(r.datos);
      this.segundos.set((performance.now() - inicio) / 1000);
    } catch (e) {
      this.error.set(e instanceof ErrorApi ? e.message : 'No se pudo buscar');
    } finally {
      this.cargando.set(false);
    }
  }

  reintentar() {
    const q = this.resultado()?.pregunta;
    if (q) this.ejecutar(q);
  }

  async convertir(tarjeta?: Tarjeta) {
    const tema = (this.resultado()?.pregunta ?? this.texto).trim();
    if (tema.length < 3) { this.error.set('Primero escribe una pregunta'); return; }
    this.creando.set(true);
    try {
      const r = await this.api.crearFoco(tema, tarjeta ?? this.sugeridos()[0]);
      this.avisos.ok('Foco creado. ¡A explorar la madriguera!');
      this.router.navigate(['/focos', r.datos.id, 'madriguera']);
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 409) this.limite.set(true);
      else this.avisos.error(e instanceof ErrorApi ? e.message : 'No se pudo crear el foco');
    } finally {
      this.creando.set(false);
    }
  }

  async liberado() {
    this.limite.set(false);
    this.avisos.ok('Foco archivado.');
    await this.convertir();
  }
}
