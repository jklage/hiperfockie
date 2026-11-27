import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, ErrorApi } from '../../core/api.service';
import { AvisosService } from '../../core/avisos.service';

@Component({
  selector: 'app-restablecer',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="contenedor pagina centro">
      <form class="panel caja" (ngSubmit)="guardar()">
        <p class="etiqueta">Recuperar
        <h1 class="titulo">Crea una nueva contraseña</h1>
        @if (!token()) {
          <p class="alerta alerta-error">El enlace no es válido. Pide uno nuevo.</p>
          <a routerLink="/recuperar" class="btn">Pedir otro enlace</a>
        } @else {
          <div class="campo">
            <label for="p1">Nueva contraseña</label>
            <input id="p1" class="input" type="password" name="p1" [(ngModel)]="p1" autocomplete="new-password" />
            <span class="ayuda">Mínimo 8 caracteres.</span>
          </div>
          <div class="campo">
            <label for="p2">Repítela</label>
            <input id="p2" class="input" type="password" name="p2" [(ngModel)]="p2" autocomplete="new-password" />
          </div>
          @if (error()) { <p class="alerta alerta-error">{{ error() }}</p> }
          <button class="btn btn-primario btn-bloque" [disabled]="cargando()">Guardar contraseña</button>
        }
      </form>
    </section>
  `,
  styles: `
    .centro { display: grid; place-items: center; padding-top: 48px; }
    .caja { width: min(100%, 460px); display: grid; gap: 14px; }
    .campo { margin: 0; }
  `,
})
export class Restablecer {
  token = input<string>();
  private api = inject(Api);
  private router = inject(Router);
  private avisos = inject(AvisosService);
  p1 = '';
  p2 = '';
  cargando = signal(false);
  error = signal('');

  async guardar() {
    this.error.set('');
    if (this.p1.length < 8) { this.error.set('La contraseña debe tener al menos 8 caracteres'); return; }
    if (this.p1 !== this.p2) { this.error.set('Las contraseñas no coinciden'); return; }
    this.cargando.set(true);
    try {
      await this.api.restablecer(this.token()!, this.p1);
      this.avisos.ok('Contraseña actualizada. Ya puedes iniciar sesión.');
      this.router.navigate(['/login']);
    } catch (e) {
      this.error.set(e instanceof ErrorApi ? e.message : 'No se pudo guardar');
    } finally {
      this.cargando.set(false);
    }
  }
}
