
import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api, ErrorApi } from '../../core/api.service';
import { AvisosService } from '../../core/avisos.service';

declare global { interface Window { paypal?: any } } // eslint-disable-line @typescript-eslint/no-explicit-any

const SDK = 'https://www.sandbox.paypal.com/web-sdk/v6/core';

@Component({
  selector: 'app-donar',
  imports: [FormsModule, CurrencyPipe],
  template: `
    <section class="contenedor pagina dos-col">
      <div>
        <p class="etiqueta">Donar
        <h1 class="titular">Hiperfockie es gratis. Si te sirvió, ayúdanos a mantenerlo.</h1>
        <p class="suave bajada">Tu donación no desbloquea nada: todo sigue igual para todas las personas.</p>
        <div class="panel uso">
          <p><b>En qué se usa</b></p>
          @for (u of usos; track u.n) { <div class="fila"><span class="etiqueta">{{ u.n }}</span><span>{{ u.que }}</span><span class="tec">{{ u.donde }}</span></div> }
        </div>
      </div>

      <div class="panel caja">
        @if (gracias(); as g) {
          <p class="etiqueta">Transacción
          <h2 class="titulo">¡Gracias por tu donación!</h2>
          <p>Recibimos {{ g | currency: 'MXN' : 'symbol-narrow' }} MXN. Te enviamos un correo de confirmación.</p>
          <button class="btn" (click)="gracias.set(null)">Hacer otra donación</button>
        } @else {
          <h2 class="titulo">Elige un monto</h2>
          <div class="montos" role="radiogroup" aria-label="Monto sugerido">
            @for (m of sugeridos; track m) {
              <button type="button" role="radio" [attr.aria-checked]="elegido() === m && !otro" [class.activo]="elegido() === m && !otro" (click)="elegir(m)">\${{ m }}</button>
            }
          </div>
          <div class="campo">
            <label for="otro">Otro monto (MXN)</label>
            <input id="otro" class="input" inputmode="decimal" placeholder="$" [(ngModel)]="otro" (ngModelChange)="error.set('')" />
          </div>
          <div class="total"><span class="suave">Vas a donar</span><b>{{ monto() !== null ? (monto()! | currency: 'MXN' : 'symbol-narrow') + ' MXN' : '—' }}</b></div>
          @if (error()) { <p class="alerta alerta-error">{{ error() }}</p> }
          <button class="btn paypal btn-bloque" (click)="pagar()" [disabled]="procesando()">{{ procesando() ? 'Abriendo PayPal…' : 'Pagar con PayPal' }}</button>
          <p class="ayuda">El pago lo procesa PayPal (modo sandbox). Hiperfockie no guarda datos de tu tarjeta. Al terminar te llega un correo de agradecimiento.</p>
        }
      </div>
    </section>
  `,
  styles: `
    .dos-col { display: grid; grid-template-columns: 1fr minmax(320px, 420px); gap: 48px; align-items: start; padding-top: 48px; }
    .titular { margin: 12px 0 16px; max-width: 16ch; font-size: clamp(2rem, 4vw, 2.6rem); }
    .bajada { max-width: 40ch; margin-bottom: 24px; }
    .uso { max-width: 380px; padding: 18px; display: grid; gap: 4px; }
    .fila { display: grid; grid-template-columns: 28px 1fr auto; gap: 8px; padding: 8px 0; border-top: 1px solid var(--borde); font-size: 15px; }
    .caja { display: grid; gap: 14px; }
    .montos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .montos button { min-height: 54px; border: 1.5px solid var(--borde); border-radius: 10px; background: var(--blanco); font-size: 18px; }
    .montos button.activo { background: var(--tinta); border-color: var(--tinta); color: #fff; }
    .campo { margin: 0; }
    .total { display: flex; justify-content: space-between; align-items: baseline; border-top: 1.5px solid var(--borde); padding-top: 14px; font-size: 20px; }
    .total span { font-size: 15px; }
    .paypal { background: #FFC439; border-color: #FFC439; color: #1D1B16; min-height: 50px; font-size: 17px; }
    .paypal:hover { background: #F2B52B; }
    @media (max-width: 767px) { .dos-col { grid-template-columns: 1fr; gap: 24px; padding-top: 20px; } }
  `,
})
export class Donar {
  private api = inject(Api);
  private avisos = inject(AvisosService);
  sugeridos = [50, 100, 200];
  usos = [
    { n: '01', que: 'Servidor', donde: 'DigitalOcean' },
    { n: '02', que: 'Dominio y correo', donde: 'Brevo SMTP' },
    { n: '03', que: 'Consultas académicas', donde: 'API de OpenAlex' },
  ];
  elegido = signal<number>(100);
  otro = '';
  error = signal('');
  procesando = signal(false);
  gracias = signal<number | null>(null);
  private sesionPaypal: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

  monto = computed<number | null>(() => {
    const o = this.otroSig();
    if (!o) return this.elegido();
    return /^\d+(\.\d{1,2})?$/.test(o) && Number(o) > 0 && Number(o) <= 10000 ? Number(o) : null;
  });
  private otroSig = signal('');

  elegir(m: number) { this.elegido.set(m); this.otro = ''; this.otroSig.set(''); this.error.set(''); }

  async pagar() {
    this.otroSig.set(this.otro.trim().replace(/^\$/, ''));
    const monto = this.monto();
    if (monto === null) { this.error.set('Escribe un monto numérico mayor a cero (máximo $10,000)'); return; }
    this.procesando.set(true);
    this.error.set('');
    try {
      const sesion = await this.prepararPaypal();
      const orden = this.api.crearOrden(monto).then((r) => ({ orderId: r.datos.id }));
      await sesion.start({ presentationMode: 'auto' }, orden);
    } catch (e) {
      this.error.set(e instanceof ErrorApi ? e.message : 'No pudimos abrir PayPal. Intenta más tarde.');
      this.procesando.set(false);
    }
  }

  private async prepararPaypal() {
    if (this.sesionPaypal) return this.sesionPaypal;
    await cargarScript(SDK);
    const { clientToken } = (await this.api.tokenPaypal()).datos;
    const sdk = await window.paypal.createInstance({ clientToken, components: ['paypal-payments'], pageType: 'checkout', locale: 'es-MX' });
    this.sesionPaypal = sdk.createPayPalOneTimePaymentSession({
      onApprove: async (data: { orderId: string }) => {
        try {
          const r = await this.api.capturar(data.orderId);
          this.gracias.set(r.datos.monto);
          this.avisos.ok('¡Gracias por tu donación!');
        } catch (e) {
          this.error.set(e instanceof ErrorApi ? e.message : 'No se pudo completar el pago');
        } finally { this.procesando.set(false); }
      },
      onCancel: () => { this.procesando.set(false); this.avisos.error('Cancelaste el pago. No se cobró nada.'); },
      onError: () => { this.procesando.set(false); this.error.set('PayPal tuvo un problema. Intenta de nuevo.'); },
    });
    return this.sesionPaypal;
  }
}

function cargarScript(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`) && window.paypal) return Promise.resolve();
  return new Promise((ok, falla) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => falla(new Error('No se cargó el SDK de PayPal'));
    document.head.appendChild(s);
  });
}
