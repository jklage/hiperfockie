import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  template: `
    <section class="contenedor pagina heroe">
      <div>
        <p class="etiqueta">Exploración guiada
        <h1 class="titular">Convierte una duda en una madriguera.</h1>
        <p class="bajada">Escribe una pregunta, revisa lo que dicen Wikipedia, OpenAlex y Open Library, y sigue los subtemas sin perder el hilo.</p>
        <div class="acciones">
          <a class="btn btn-primario" routerLink="/registro">Crear cuenta gratis</a>
          <a class="btn" routerLink="/login">Ya tengo cuenta</a>
        </div>
      </div>
      <svg class="arbol" viewBox="0 0 360 300" role="img" aria-label="Ejemplo de madriguera con cuatro niveles">
        <g class="tec-svg"><text x="0" y="24">N1</text><text x="0" y="104">N2</text><text x="0" y="184">N3</text><text x="0" y="264">N4</text></g>
        <g stroke="#1D1B16" stroke-width="1.5">
          <line x1="200" y1="20" x2="120" y2="100" /><line x1="200" y1="20" x2="290" y2="100" />
          <line x1="120" y1="100" x2="70" y2="180" /><line x1="120" y1="100" x2="170" y2="180" /><line x1="290" y1="100" x2="280" y2="180" />
          <line x1="170" y1="180" x2="135" y2="260" /><line x1="170" y1="180" x2="220" y2="260" />
        </g>
        <g fill="#1D1B16"><circle cx="200" cy="20" r="14" /><circle cx="120" cy="100" r="14" /><circle cx="290" cy="100" r="14" /><circle cx="70" cy="180" r="14" /><circle cx="280" cy="180" r="14" /></g>
        <circle cx="170" cy="180" r="14" fill="#E4572E" />
        <g fill="#fff" stroke="#1D1B16" stroke-width="1.5"><circle cx="135" cy="260" r="13" /><circle cx="220" cy="260" r="13" /></g>
        <text x="192" y="185" class="txt-naranja">estás aquí</text>
        <text x="242" y="265" class="tec-svg">sugeridos</text>
      </svg>
    </section>
    <section class="contenedor rasgos">
      @for (r of rasgos; track r.n) {
        <div><p><span class="etiqueta">{{ r.n }}</span> <b>{{ r.titulo }}</b></p><p class="suave">{{ r.texto }}</p></div>
      }
    </section>
  `,
  styles: `
    .heroe { display: grid; grid-template-columns: 1.1fr 1fr; gap: 40px; align-items: center; padding-top: 56px; }
    .titular { margin: 12px 0 20px; max-width: 12ch; }
    .bajada { max-width: 44ch; color: var(--tinta-2); font-size: 17px; }
    .acciones { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
    .arbol { width: 100%; max-width: 420px; justify-self: center; }
    .tec-svg { font-family: var(--f-tec); font-size: 12px; fill: var(--tinta-2); }
    .txt-naranja { font-family: var(--f-tec); font-size: 12px; fill: var(--naranja); }
    .rasgos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; padding-bottom: 64px; }
    .rasgos > div { border-top: 1.5px solid var(--tinta); padding-top: 14px; }
    .rasgos b { font-weight: 600; }
    .rasgos .etiqueta { margin-right: 8px; }
    @media (max-width: 767px) { .heroe, .rasgos { grid-template-columns: 1fr; } .heroe { padding-top: 24px; } .arbol { max-width: 300px; } }
  `,
})
export class Inicio {
  rasgos = [
    { n: '01', titulo: 'Tres fuentes, cero IA', texto: 'Cada tarjeta dice de dónde viene y con qué licencia.' },
    { n: '02', titulo: 'Máximo 5 focos', texto: 'Menos pestañas abiertas, más temas terminados.' },
    { n: '03', titulo: 'Historial en cómic', texto: 'Repasa tu camino viñeta por viñeta.' },
  ];
}
