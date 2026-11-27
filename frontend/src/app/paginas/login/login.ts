import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api, ErrorApi } from '../../core/api.service';
import { SesionService } from '../../core/sesion.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="contenedor pagina dos-col">
      <div>
        <p class="etiqueta">Sesión
        <h1 class="titular">Una duda lleva a otra.</h1>
        <p class="suave bajada">Entra para retomar tus focos justo donde los dejaste.</p>
        <p class="tec puntos-linea"><span class="puntos"><i class="lleno"></i><i class="lleno"></i><i class="lleno"></i><i class="lleno"></i><i></i></span> hasta 5 focos activos te esperan</p>
      </div>
      <form class="panel" [formGroup]="form" (ngSubmit)="entrar()" novalidate>
        <h2 class="titulo">Inicia sesión</h2>
        @if (expirada) { <p class="alerta alerta-aviso">Tu sesión expiró. Vuelve a entrar.</p> }
        <div class="campo">
          <label for="correo">Correo electrónico</label>
          <input id="correo" class="input" type="email" formControlName="correo" autocomplete="email" placeholder="tu@correo.com" />
        </div>
        <div class="campo">
          <label for="password">Contraseña</label>
          <input id="password" class="input" type="password" formControlName="password" autocomplete="current-password" [class.invalido]="error()" />
          @if (error()) { <span class="error-campo" role="alert">{{ error() }}</span> }
        </div>
        <button class="btn btn-primario btn-bloque" type="submit" [disabled]="cargando()">{{ cargando() ? 'Entrando…' : 'Entrar' }}</button>
        <div class="enlaces"><a routerLink="/recuperar">¿Olvidaste tu contraseña?</a><a routerLink="/registro" class="tinta">Crear cuenta</a></div>
      </form>
    </section>
  `,
  styles: `
    .dos-col { display: grid; grid-template-columns: 1fr minmax(320px, 420px); gap: 48px; align-items: center; padding-top: 56px; }
    .titular { margin: 12px 0 16px; max-width: 10ch; }
    .bajada { max-width: 36ch; }
    .puntos-linea { display: flex; gap: 12px; align-items: center; margin-top: 28px; }
    .panel { display: grid; gap: 4px; }
    .titulo { margin-bottom: 16px; }
    .alerta { margin-bottom: 12px; }
    .enlaces { display: flex; justify-content: space-between; margin-top: 16px; font-size: 14px; }
    .tinta { color: var(--tinta); }
    @media (max-width: 767px) { .dos-col { grid-template-columns: 1fr; gap: 24px; padding-top: 24px; } }
  `,
})
export class Login {
  private api = inject(Api);
  private sesion = inject(SesionService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);
  expirada = this.ruta.snapshot.queryParamMap.has('expirada');
  form = inject(FormBuilder).nonNullable.group({ correo: ['', [Validators.required]], password: ['', [Validators.required]] });
  error = signal('');
  cargando = signal(false);

  async entrar() {
    const { correo, password } = this.form.getRawValue();
    if (!correo.trim() || !password) { this.error.set('Escribe tu correo y tu contraseña'); return; }
    this.cargando.set(true);
    this.error.set('');
    try {
      const r = await this.api.login({ correo, password });
      this.sesion.iniciar(r.datos);
      const volver = this.ruta.snapshot.queryParamMap.get('volver');
      this.router.navigateByUrl(volver?.startsWith('/') ? volver : '/explorar');
    } catch (e) {
      this.error.set(e instanceof ErrorApi ? e.message : 'No se pudo iniciar sesión');
    } finally {
      this.cargando.set(false);
    }
  }
}
