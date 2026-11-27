
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SesionService } from '../../core/sesion.service';
import { Logo } from '../logo/logo';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Logo],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  sesion = inject(SesionService);
  private router = inject(Router);

  secciones = [
    { ruta: '/explorar', texto: 'Explorar', corto: 'Explorar', icono: 'M11 4a7 7 0 1 0 4.3 12.5l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z' },
    { ruta: '/focos', texto: 'Mis focos', corto: 'Focos', icono: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z' },
    { ruta: '/historial', texto: 'Historial', corto: 'Historial', icono: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z' },
    { ruta: '/donar', texto: 'Donar', corto: 'Donar', icono: 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11Z' },
    { ruta: '/aviso-privacidad', texto: 'Aviso', corto: 'Aviso', icono: 'M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Zm-1 6h2v6h-2V8Zm0 8h2v2h-2v-2Z' },
  ];

  salir() {
    this.sesion.cerrar();
    this.router.navigate(['/']);
  }
}
