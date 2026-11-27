import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './componentes/navbar/navbar';
import { PiePagina } from './componentes/pie/pie';
import { Toasts } from './componentes/toasts/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, PiePagina, Toasts],
  template: `
    <app-navbar />
    <main id="contenido"><router-outlet /></main>
    <app-pie />
    <app-toasts />
  `,
  styles: `:host { display: flex; flex-direction: column; min-height: 100dvh; } main { flex: 1; }`,
})
export class App {}
