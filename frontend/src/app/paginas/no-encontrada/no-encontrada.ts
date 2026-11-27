import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SesionService } from '../../core/sesion.service';

@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink],
  template: `
    <section class="contenedor pagina dos-col">
      <div>
        <p class="etiqueta">{{ sinAcceso ? 'Error 401 // sin sesión' : 'Error 404 // glitch.01' }}</p>
        <h1 class="titular">{{ sinAcceso ? 'Esta madriguera necesita tu llave.' : 'Esta madriguera no lleva a ningún lado.' }}</h1>
        <p class="suave">La página no existe o necesitas iniciar sesión para verla.</p>
        <div class="acciones">
          @if (!sesion.activa()) { <a class="btn btn-primario" routerLink="/login" [queryParams]="volver ? { volver } : {}">Iniciar sesión</a> }
          <a class="btn" [routerLink]="sesion.activa() ? '/explorar' : '/'">Volver a Inicio</a>
        </div>
      </div>
      <svg viewBox="0 0 320 300" aria-hidden="true" class="hoyo">
        <path d="M60 10 C 90 80, 120 90, 150 130 S 190 190, 190 220" fill="none" stroke="#1D1B16" stroke-width="2" stroke-dasharray="7 7" />
        <path d="M182 210 l8 14 l8 -14" fill="none" stroke="#1D1B16" stroke-width="2" />
        <text x="215" y="40" class="t">tú, hace</text><text x="215" y="56" class="t">un momento</text>
        <ellipse cx="190" cy="250" rx="125" ry="38" fill="#1D1B16" />
        <ellipse cx="190" cy="247" rx="95" ry="22" fill="none" stroke="#E4572E" stroke-width="2" />
      </svg>
    </section>
    <p class="tec pie">PROFUNDIDAD: SIN FONDO · EL NIVEL 6 NO EXISTE</p>
  `,
  styles: `
    .dos-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; padding-top: 56px; }
    .titular { margin: 12px 0 16px; max-width: 13ch; }
    .acciones { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
    .hoyo { width: 100%; max-width: 380px; justify-self: center; }
    .t { font-family: var(--f-tec); font-size: 12px; fill: var(--tinta-2); }
    .pie { text-align: center; padding-bottom: 32px; }
    @media (max-width: 767px) { .dos-col { grid-template-columns: 1fr; padding-top: 24px; } .hoyo { max-width: 260px; } }
  `,
})
export class NoEncontrada {
  sesion = inject(SesionService);
  private ruta = inject(ActivatedRoute);
  sinAcceso = this.ruta.snapshot.data['motivo'] === 'sesion';
  volver = this.ruta.snapshot.queryParamMap.get('volver');
}
