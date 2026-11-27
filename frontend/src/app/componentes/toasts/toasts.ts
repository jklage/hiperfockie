import { Component, inject } from '@angular/core';
import { AvisosService } from '../../core/avisos.service';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="pila" role="status" aria-live="polite">
      @for (t of avisos.lista(); track t.id) {
        <div class="alerta" [class.alerta-ok]="t.tipo === 'ok'" [class.alerta-error]="t.tipo === 'error'">{{ t.texto }}</div>
      }
    </div>
  `,
  styles: `
    .pila { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 50; display: grid; gap: 8px; width: min(92vw, 420px); }
    .alerta { box-shadow: 0 6px 20px rgba(29,27,22,.12); font-weight: 600; animation: entrar .2s ease-out; }
    @keyframes entrar { from { opacity: 0; transform: translateY(8px); } }
    @media (max-width: 767px) { .pila { bottom: 84px; } }
  `,
})
export class Toasts {
  avisos = inject(AvisosService);
}
