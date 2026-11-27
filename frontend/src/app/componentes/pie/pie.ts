import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pie',
  imports: [RouterLink],
  template: `
    <footer>
      <div class="contenedor fila">
        <span><a routerLink="/aviso-privacidad">Aviso de privacidad</a> · <a href="mailto:contacto@hiperfockie.mx">contacto&#64;hiperfockie.mx</a></span>
        <span>Fuentes: Wikipedia · OpenAlex · Open Library</span>
      </div>
    </footer>
  `,
  styles: `
    footer { border-top: 1.5px solid var(--borde); background: var(--papel); font-size: 13px; color: var(--tinta-2); }
    .fila { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding-top: 14px; padding-bottom: 14px; }
    a { color: var(--tinta-2); }
    @media (max-width: 767px) { footer { padding-bottom: 72px; } }
  `,
})
export class PiePagina {}
