
import { Component, ElementRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as d3 from 'd3';
import { Api, ErrorApi } from '../../core/api.service';
import { AvisosService } from '../../core/avisos.service';
import { Arbol, Aviso, NOMBRE_FUENTE, Nodo, Nota, Tarjeta } from '../../core/modelos';
import { dos, fechaCorta, hora } from '../../core/formato';

interface Punto { id: string; padre: string | null; titulo: string; tipo: 'visitado' | 'actual' | 'sugerido' | 'tope'; nivel: number; nodo?: Nodo; tarjeta?: Tarjeta; }

const ANCHO = 172, ALTO = 58, SEP_X = 190, SEP_Y = 96, MARGEN_IZQ = 48;

@Component({
  selector: 'app-madriguera',
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './madriguera.html',
  styleUrl: './madriguera.css',
})
export class Madriguera {
  id = input.required<string>();
  private api = inject(Api);
  private avisos = inject(AvisosService);
  private lienzo = viewChild<ElementRef<SVGSVGElement>>('lienzo');

  arbol = signal<Arbol | null>(null);
  seleccion = signal<Nodo | null>(null);
  sugeridos = signal<Tarjeta[]>([]);
  avisosFuente = signal<Aviso[]>([]);
  cargandoSug = signal(false);
  avanzando = signal(false);
  error = signal('');
  notas = signal<Nota[]>([]);
  nuevaNota = '';
  editando = signal<number | null>(null);
  textoEdicion = '';
  nombre = NOMBRE_FUENTE;
  dos = dos; hora = hora; fechaCorta = fechaCorta;

  focoId = computed(() => Number(this.id()));
  activo = computed(() => this.arbol()?.foco.estado === 'activo');
  nivelActual = computed(() => this.seleccion()?.nivel ?? 1);

  constructor() {
    effect(() => { this.cargar(this.focoId()); });
    effect(() => this.dibujar());
  }

  private async cargar(id: number, seleccionar?: number) {
    try {
      const a = (await this.api.arbol(id)).datos;
      this.arbol.set(a);
      const visitados = a.nodos.filter((n) => n.visitadoEn);
      const elegido = a.nodos.find((n) => n.id === seleccionar)
        ?? [...visitados].sort((x, y) => +new Date(y.visitadoEn!) - +new Date(x.visitadoEn!))[0];
      if (elegido) await this.seleccionar(elegido);
    } catch (e) {
      this.error.set(e instanceof ErrorApi ? e.message : 'No se pudo cargar la madriguera');
    }
  }

  async seleccionar(n: Nodo) {
    this.seleccion.set(n);
    this.editando.set(null);
    this.sugeridos.set([]);
    this.avisosFuente.set([]);
    this.api.notas(n.id).then((r) => this.notas.set(r.datos));
    if (!this.activo()) return;
    this.cargandoSug.set(true);
    try {
      const r = (await this.api.subtemas(this.focoId(), n.id)).datos;
      if (this.seleccion()?.id === n.id) { this.sugeridos.set(r.subtemas); this.avisosFuente.set(r.avisos); }
    } finally {
      this.cargandoSug.set(false);
    }
  }

  async avanzar(t: Tarjeta) {
    const padre = this.seleccion();
    if (!padre || this.avanzando()) return;
    this.avanzando.set(true);
    try {
      const r = (await this.api.avanzar(this.focoId(), padre.id, t)).datos;
      this.avisos.ok(r.accion === 'regresar' ? `Regresaste a «${r.nodo.titulo}»` : `Bajaste al nivel ${r.nodo.nivel}`);
      await this.cargar(this.focoId(), r.nodo.id);
    } catch (e) {
      this.avisos.error(e instanceof ErrorApi ? e.message : 'No se pudo avanzar');
    } finally {
      this.avanzando.set(false);
    }
  }

  async guardarNota() {
    const n = this.seleccion();
    const texto = this.nuevaNota.trim();
    if (!n || !texto) return;
    try {
      const r = await this.api.crearNota(n.id, texto);
      this.notas.update((l) => [...l, r.datos]);
      this.nuevaNota = '';
      this.avisos.ok('Nota guardada');
    } catch (e) { this.avisos.error(e instanceof ErrorApi ? e.message : 'No se pudo guardar'); }
  }
  editar(nota: Nota) { this.editando.set(nota.id); this.textoEdicion = nota.texto; }
  async actualizar(nota: Nota) {
    try {
      const r = await this.api.editarNota(nota.id, this.textoEdicion.trim());
      this.notas.update((l) => l.map((x) => (x.id === nota.id ? r.datos : x)));
      this.editando.set(null);
      this.avisos.ok('Nota actualizada');
    } catch (e) { this.avisos.error(e instanceof ErrorApi ? e.message : 'No se pudo actualizar'); }
  }
  async eliminar(nota: Nota) {
    try {
      await this.api.eliminarNota(nota.id);
      this.notas.update((l) => l.filter((x) => x.id !== nota.id));
      this.avisos.ok('Nota eliminada');
    } catch (e) { this.avisos.error(e instanceof ErrorApi ? e.message : 'No se pudo eliminar'); }
  }

  private dibujar() {
    const svgEl = this.lienzo()?.nativeElement;
    const a = this.arbol();
    const sel = this.seleccion();
    const sug = this.sugeridos();
    if (!svgEl || !a) return;

    const puntos: Punto[] = a.nodos.map((n) => ({
      id: `n${n.id}`, padre: n.padreId ? `n${n.padreId}` : null, titulo: n.titulo, nivel: n.nivel, nodo: n,
      tipo: n.id === sel?.id ? 'actual' : 'visitado',
    }));
    if (sel && this.activo()) {
      if (sel.nivel >= 5) puntos.push({ id: 'tope', padre: `n${sel.id}`, titulo: 'Nivel máximo', nivel: 6, tipo: 'tope' });
      else sug.filter((t) => !t.visitado).slice(0, 3).forEach((t, i) =>
        puntos.push({ id: `s${i}`, padre: `n${sel.id}`, titulo: t.titulo, nivel: sel.nivel + 1, tipo: 'sugerido', tarjeta: t }));
    }
    const raiz = d3.stratify<Punto>().id((p) => p.id).parentId((p) => p.padre)(puntos);
    d3.tree<Punto>().nodeSize([SEP_X, SEP_Y])(raiz);
    const desc = raiz.descendants() as d3.HierarchyPointNode<Punto>[];
    const minX = d3.min(desc, (d) => d.x)!, maxX = d3.max(desc, (d) => d.x)!;
    const ancho = maxX - minX + ANCHO + MARGEN_IZQ + 24;
    const filas = Math.min(5, Math.max(...desc.map((d) => Math.min(d.data.nivel, 5))));
    const alto = filas * SEP_Y + 8;
    const x = (d: d3.HierarchyPointNode<Punto>) => d.x - minX + MARGEN_IZQ + ANCHO / 2 + 8;
    const y = (d: d3.HierarchyPointNode<Punto>) => (Math.min(d.data.nivel, 5) - 1) * SEP_Y + ALTO / 2 + 4;

    const svg = d3.select(svgEl).attr('viewBox', `0 0 ${ancho} ${alto}`).attr('width', ancho).attr('height', alto);
    svg.selectAll('*').remove();

    svg.append('g').selectAll('text').data(d3.range(1, filas + 1)).join('text')
      .attr('class', 'nivel').attr('x', 0).attr('y', (n) => (n - 1) * SEP_Y + ALTO / 2 + 8).text((n) => `N${n}`);

    svg.append('g').selectAll('path').data(raiz.links() as d3.HierarchyPointLink<Punto>[]).join('path')
      .attr('class', (l) => `rama ${l.target.data.tipo}`)
      .attr('d', (l) => `M${x(l.source)},${y(l.source) + ALTO / 2} L${x(l.target)},${y(l.target) - ALTO / 2}`);

    const g = svg.append('g').selectAll('g').data(desc).join('g')
      .attr('class', (d) => `caja ${d.data.tipo}`)
      .attr('transform', (d) => `translate(${x(d) - ANCHO / 2},${y(d) - ALTO / 2})`)
      .attr('tabindex', (d) => (d.data.tipo === 'tope' ? null : 0))
      .attr('role', 'button')
      .attr('aria-label', (d) => (d.data.tipo === 'sugerido' ? `Avanzar a ${d.data.titulo}` : d.data.titulo))
      .on('click', (_e, d) => this.clic(d.data))
      .on('keydown', (e: KeyboardEvent, d) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.clic(d.data); } });

    g.append('rect').attr('width', ANCHO).attr('height', ALTO).attr('rx', 6);
    g.append('foreignObject').attr('width', ANCHO).attr('height', ALTO)
      .append('xhtml:div').attr('class', 'texto-caja')
      .append('xhtml:span').text((d) => d.data.titulo);
    g.filter((d) => d.data.tipo === 'sugerido').append('text').attr('class', 'puntaje')
      .attr('x', ANCHO - 6).attr('y', -5).attr('text-anchor', 'end')
      .text((d) => d.data.tarjeta!.puntaje.toFixed(2));

    svg.attr('width', null).attr('height', null).style('width', '100%').style('max-width', `${ancho}px`).style('min-width', `${Math.min(ancho, 560)}px`);
    const actual = desc.find((d) => d.data.tipo === 'actual');
    const cont = svgEl.parentElement;
    if (actual && cont) {
      const escala = svgEl.getBoundingClientRect().width / ancho;
      cont.scrollLeft = cont.scrollWidth > cont.clientWidth ? x(actual) * escala - cont.clientWidth / 2 : 0;
    }
  }

  private clic(p: Punto) {
    if (p.tipo === 'sugerido' && p.tarjeta) this.avanzar(p.tarjeta);
    else if (p.nodo && p.tipo !== 'actual') this.seleccionar(p.nodo);
  }
}
