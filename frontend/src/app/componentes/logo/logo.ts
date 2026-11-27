import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  template: `
    <a [routerLink]="destino()" class="logo" aria-label="Hiperfockie, ir al inicio">
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <ellipse cx="16" cy="21" rx="14" ry="8" fill="#1D1B16" />
        <ellipse cx="16" cy="13" rx="8" ry="6" fill="#E4572E" />
      </svg>
      <span>hiperfockie</span>
    </a>
  `,
  styles: `
    .logo { display: inline-flex; align-items: center; gap: 8px; color: var(--tinta); text-decoration: none; }
    span { font-family: var(--f-logo); font-size: 24px; letter-spacing: .01em; }
    @media (max-width: 400px) { span { font-size: 20px; } svg { width: 24px; } }
  `,
})
export class Logo {
  destino = input('/');
}
