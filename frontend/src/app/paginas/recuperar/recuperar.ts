import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, ErrorApi } from '../../core/api.service';

@Component({
  selector: 'app-recuperar',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="contenedor pagina centro">
      <form class="panel caja" (ngSubmit)="enviar()">
        <p class="etiqueta">Recuperar
        <h1 class="titulo">¿Olvidaste tu contraseña?</h1>
        <p class="suave">Escribe tu correo y te mandamos un enlace para crear una nueva. El enlace dura 30 minutos y sirve una vez.</p>
        <div class="campo">
          <label for="correo">Correo electrónico</label>
          <input id="correo" class="input" type="email" name="correo" [(ngModel)]="correo" required autocomplete="email" />
        </div>
        <button class="btn btn-primario btn-bloque" [disabled]="cargando()">{{ cargando() ? 'Enviando…' : 'Enviar enlace' }}</button>
        @if (ok()) { <p class="alerta alerta-ok">{{ ok() }}</p> }
        @if (error()) { <p class="alerta alerta-error">{{ error() }}</p> }
        <a routerLink="/login" class="volver">← Volver a iniciar sesión</a>
      </form>
    </section>
  `,
  styles: `
    .centro { display: grid; place-items: center; padding-top: 48px; }
    .caja { width: min(100%, 460px); display: grid; gap: 14px; }
    .campo { margin: 0; }
    .volver { color: var(--tinta); font-size: 14px; }
  `,
})
export class Recuperar {
  private api = inject(Api);
  correo = '';
  cargando = signal(false);
  ok = signal('');
  error = signal('');

  async enviar() {
    this.ok.set(''); this.error.set('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.correo.trim())) { this.error.set('Escribe un correo válido'); return; }
    this.cargando.set(true);
    try {
      await this.api.recuperar(this.correo.trim());
      this.ok.set('Si el correo está registrado, el enlace ya va en camino. Revisa también spam.');
    } catch (e) {
      this.error.set(e instanceof ErrorApi ? e.message : 'No se pudo enviar el enlace');
    } finally {
      this.cargando.set(false);
    }
  }
}
