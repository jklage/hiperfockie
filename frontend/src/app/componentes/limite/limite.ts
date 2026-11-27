//en components se tienen las piezas que se van a reutilizar, como barras de navefacion, tarjeas, avisos, etc.
//en este arcgivo se reutiliza un aviso de limite de focos activos, para que el usuario pueda archivar uno y liberar espacio para crear otro foco
import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { Api, ErrorApi } from '../../core/api.service';
import { Foco } from '../../core/modelos';
import { dos } from '../../core/formato';

@Component({
  selector: 'app-limite',
  template: `
    <div class="fondo" (click)="cerrar.emit()"></div>
    <div class="modal panel" role="dialog" aria-modal="true" aria-labelledby="titulo-limite">
      <p class="etiqueta">409</p>
      <h2 id="titulo-limite" class="titulo">Ya tienes 5 focos activos</h2>
      <p class="suave">
        Para convertir «{{ tema() }}» en foco, archiva uno de estos. Podrás reactivarlo cuando
        quieras.
      </p>
      <ul>
        @for (f of activos(); track f.id; let i = $index) {
          <li>
            <span class="etiqueta">{{ dos(i + 1) }}</span>
            <span class="tema">{{ f.tema }}</span>
            <button class="btn btn-chico" (click)="archivar(f)" [disabled]="ocupado()">
              Archivar
            </button>
          </li>
        }
      </ul>
      @if (error()) {
        <p class="alerta alerta-error">{{ error() }}</p>
      }
      <div class="acciones"><button class="btn" (click)="cerrar.emit()">Cancelar</button></div>
    </div>
  `,
  styles: `
    .fondo {
      position: fixed;
      inset: 0;
      background: rgba(29, 27, 22, 0.45);
      z-index: 40;
    }
    .modal {
      position: fixed;
      z-index: 41;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(94vw, 560px);
      max-height: 90dvh;
      overflow: auto;
      border: 2px solid var(--tinta);
      display: grid;
      gap: 10px;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 4px 0;
    }
    li {
      display: grid;
      grid-template-columns: 28px 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 10px 0;
      border-top: 1px solid var(--borde);
    }
    .tema {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .acciones {
      display: flex;
      justify-content: flex-end;
    }
  `,
})
export class Limite implements OnInit {
  tema = input('');
  cerrar = output<void>();
  liberado = output<void>();
  private api = inject(Api);
  activos = signal<Foco[]>([]);
  ocupado = signal(false);
  error = signal('');
  dos = dos;

  async ngOnInit() {
    const r = await this.api.focos();
    this.activos.set(r.datos.filter((f) => f.estado === 'activo'));
  }

  async archivar(f: Foco) {
    this.ocupado.set(true);
    try {
      await this.api.estadoFoco(f.id, 'archivado');
      this.liberado.emit();
    } catch (e) {
      this.error.set(e instanceof ErrorApi ? e.message : 'No se pudo archivar');
    } finally {
      this.ocupado.set(false);
    }
  }
}
