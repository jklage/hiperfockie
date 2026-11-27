//contiene una pantalla por seccion, por ejemplo, la pantalla de aviso de privacidad, la pantalla de terminos y condiciones, etc
//esta pantalla es publica, no requiere que el usuario este logueado
import { Component } from '@angular/core';

@Component({
  selector: 'app-aviso',
  template: `
    <section class="contenedor pagina rejilla">
      <article>
        <p class="etiqueta">LFPDPPP · Última actualización 16/11/26</p>
        <h1 class="titulo">Aviso de privacidad</h1>
        @for (s of secciones; track s.id) {
          <section [id]="s.id" class="bloque">
            <span class="etiqueta num">{{ s.n }}</span>
            <div>
              <h2>{{ s.titulo }}</h2>
              <p class="suave" [innerHTML]="s.texto"></p>
            </div>
          </section>
        }
      </article>
      <aside class="panel indice oculto-movil">
        <p><b>En esta página</b></p>
        @for (s of secciones; track s.id) {
          <a [href]="'#' + s.id" class="tec">{{ s.n }} {{ s.titulo }}</a>
        }
      </aside>
    </section>
  `,
  styles: `
    .rejilla {
      display: grid;
      grid-template-columns: minmax(0, 680px) 240px;
      gap: 40px;
      justify-content: center;
    }
    .titulo {
      margin: 8px 0 20px;
    }
    .bloque {
      display: grid;
      grid-template-columns: 40px 1fr;
      gap: 4px;
      border-top: 1.5px solid var(--borde);
      padding: 18px 0;
      scroll-margin-top: 80px;
    }
    .num {
      padding-top: 4px;
    }
    h2 {
      font-size: 1.15rem;
      margin-bottom: 4px;
    }
    .indice {
      position: sticky;
      top: 88px;
      align-self: start;
      display: grid;
      gap: 8px;
      padding: 18px;
    }
    .indice a {
      color: var(--tinta-2);
    }
    @media (max-width: 767px) {
      .rejilla {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Aviso {
  secciones = [
    {
      id: 'responsable',
      n: '01',
      titulo: 'Responsable',
      texto:
        'Hiperfockie es un proyecto escolar del CETI Colomos a cargo de Francisco Yael Pérez Palacios y Carlos Gael Barbosa Mendoza.',
    },
    {
      id: 'datos',
      n: '02',
      titulo: 'Datos que recabamos',
      texto:
        'Nombre, correo electrónico, contraseña (guardada cifrada con bcrypt), preguntas, focos, notas e historial. No pedimos datos sensibles ni bancarios: los pagos los procesa PayPal.',
    },
    {
      id: 'uso',
      n: '03',
      titulo: 'Para qué los usamos',
      texto:
        'Crear tu cuenta, guardar tu exploración y enviarte correos del servicio: bienvenida, recuperación de contraseña y agradecimiento por donaciones. Solo compartimos tu correo con el proveedor de correo (Brevo) y, si donas, PayPal procesa el pago.',
    },
    {
      id: 'arco',
      n: '04',
      titulo: 'Derechos ARCO',
      texto:
        'Escribe a <a href="mailto:contacto@hiperfockie.mx">contacto@hiperfockie.mx</a> para acceder, corregir, cancelar u oponerte al uso de tus datos. Si cancelas tu cuenta, borramos tus focos, notas e historial.',
    },
    {
      id: 'cambios',
      n: '05',
      titulo: 'Cambios a este aviso',
      texto: 'Cualquier cambio se publica en esta misma página con su nueva fecha.',
    },
  ];
}
