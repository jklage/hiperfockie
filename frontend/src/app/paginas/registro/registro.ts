import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, ErrorApi } from '../../core/api.service';
import { SesionService } from '../../core/sesion.service';
import { AvisosService } from '../../core/avisos.service';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="contenedor pagina dos-col">
      <div>
        <p class="etiqueta">Registro
        <h1 class="titular">Tu primera madriguera empieza aquí.</h1>
        <div class="panel guardamos">
          <p><b>Lo que guardamos</b></p>
          <p class="suave">Nombre, correo, tus preguntas, focos y notas. No pedimos datos bancarios ni datos sensibles.</p>
        </div>
      </div>
      <form class="panel" [formGroup]="form" (ngSubmit)="crear()" novalidate>
        <h2 class="titulo">Crear cuenta</h2>
        <div class="campo">
          <label for="nombre">Nombre</label>
          <input id="nombre" class="input" formControlName="nombre" maxlength="80" autocomplete="name" [class.invalido]="tocado('nombre')" />
          @if (tocado('nombre')) { <span class="error-campo">Escribe tu nombre</span> }
        </div>
        <div class="campo">
          <label for="correo">Correo electrónico</label>
          <input id="correo" class="input" type="email" formControlName="correo" maxlength="120" autocomplete="email" [class.invalido]="tocado('correo') || errorCorreo()" />
          @if (tocado('correo')) { <span class="error-campo">Escribe un correo válido</span> }
          @if (errorCorreo()) { <span class="error-campo">{{ errorCorreo() }}</span> }
        </div>
        <div class="campo">
          <label for="password">Contraseña</label>
          <input id="password" class="input" type="password" formControlName="password" autocomplete="new-password" [class.invalido]="tocado('password')" />
          <span class="ayuda" [class.error-campo]="tocado('password')">Mínimo 8 caracteres.</span>
        </div>
        <label class="casilla">
          <input type="checkbox" formControlName="aceptoAviso" />
          <span>He leído y acepto el <a routerLink="/aviso-privacidad" target="_blank">aviso de privacidad</a></span>
        </label>
        @if (error()) { <p class="alerta alerta-error">{{ error() }}</p> }
        <button class="btn btn-primario btn-bloque" type="submit" [disabled]="!form.controls.aceptoAviso.value || cargando()">
          {{ cargando() ? 'Creando…' : 'Crear cuenta' }}
        </button>
        @if (!form.controls.aceptoAviso.value) { <p class="ayuda centro">Marca la casilla para continuar.</p> }
      </form>
    </section>
  `,
  styles: `
    .dos-col { display: grid; grid-template-columns: 1fr minmax(320px, 420px); gap: 48px; align-items: start; padding-top: 56px; }
    .titular { margin: 12px 0 28px; max-width: 12ch; }
    .guardamos { max-width: 340px; display: grid; gap: 6px; font-size: 15px; }
    .titulo { margin-bottom: 16px; }
    .casilla { display: flex; gap: 10px; align-items: flex-start; margin: 4px 0 16px; font-size: 15px; }
    .casilla input { width: 20px; height: 20px; margin-top: 2px; accent-color: var(--naranja); }
    .alerta { margin-bottom: 12px; }
    .centro { text-align: center; margin-top: 8px; }
    @media (max-width: 767px) { .dos-col { grid-template-columns: 1fr; gap: 24px; padding-top: 24px; } }
  `,
})
export class Registro {
  private api = inject(Api);
  private sesion = inject(SesionService);
  private router = inject(Router);
  private avisos = inject(AvisosService);
  form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.pattern(/\S/)]],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    aceptoAviso: [false, Validators.requiredTrue],
  });
  error = signal('');
  errorCorreo = signal('');
  cargando = signal(false);

  tocado(c: 'nombre' | 'correo' | 'password') {
    const ctl = this.form.controls[c];
    return ctl.invalid && (ctl.touched || ctl.dirty);
  }

  async crear() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.cargando.set(true);
    this.error.set('');
    this.errorCorreo.set('');
    try {
      const r = await this.api.registro(this.form.getRawValue());
      this.sesion.iniciar(r.datos);
      this.avisos.ok(`¡Bienvenido, ${r.datos.usuario.nombre.split(' ')[0]}! Revisa tu correo.`);
      this.router.navigate(['/explorar']);
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 409) this.errorCorreo.set(e.message);
      else this.error.set(e instanceof ErrorApi ? e.message : 'No se pudo crear la cuenta');
    } finally {
      this.cargando.set(false);
    }
  }
}
