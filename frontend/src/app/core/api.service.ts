//core es el motor de la aplicación, contiene el servicio de api y los modelos de datos
//por ejemplo, en api.service.ts  (osea aqui), se tieneel token de paypal, y los metodos para hacer peticiones al backend
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  Arbol,
  Foco,
  Historial,
  Nodo,
  Nota,
  Respuesta,
  ResultadoBusqueda,
  Sesion,
  Subtemas,
  Tarjeta,
} from './modelos';

export class ErrorApi extends Error {
  constructor(
    public status: number,
    mensaje: string,
    public datos: unknown = null,
  ) {
    super(mensaje);
  }
}

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  private async pedir<T>(
    metodo: string,
    ruta: string,
    cuerpo?: unknown,
    params?: Record<string, string | number>,
  ): Promise<Respuesta<T>> {
    try {
      return await firstValueFrom(
        this.http.request<Respuesta<T>>(metodo, `/api${ruta}`, { body: cuerpo, params }),
      );
    } catch (e) {
      if (e instanceof HttpErrorResponse) {
        const r = e.error as Partial<Respuesta<unknown>> | null;
        const mensaje =
          r?.mensaje ??
          (e.status === 0 ? 'No hay conexión con el servidor' : 'Ocurrió un error inesperado');
        throw new ErrorApi(e.status, mensaje, r?.datos ?? null);
      }
      throw e;
    }
  }

  registro = (d: { nombre: string; correo: string; password: string; aceptoAviso: boolean }) =>
    this.pedir<Sesion>('POST', '/auth/registro', d);
  login = (d: { correo: string; password: string }) => this.pedir<Sesion>('POST', '/auth/login', d);
  recuperar = (correo: string) => this.pedir<null>('POST', '/auth/recuperar', { correo });
  restablecer = (token: string, password: string) =>
    this.pedir<null>('POST', '/auth/restablecer', { token, password });

  buscar = (q: string) => this.pedir<ResultadoBusqueda>('GET', '/busqueda', undefined, { q });

  focos = () => this.pedir<Foco[]>('GET', '/focos');
  crearFoco = (tema: string, tarjeta?: Tarjeta) =>
    this.pedir<{ id: number; nodoRaizId: number }>('POST', '/focos', { tema, tarjeta });
  estadoFoco = (id: number, estado: 'activo' | 'archivado') =>
    this.pedir<Foco>('PATCH', `/focos/${id}`, { estado });
  arbol = (id: number) => this.pedir<Arbol>('GET', `/focos/${id}/arbol`);
  subtemas = (id: number, nodo?: number) =>
    this.pedir<Subtemas>('GET', `/focos/${id}/subtemas`, undefined, nodo ? { nodo } : undefined);
  avanzar = (id: number, padreId: number, tarjeta: Tarjeta) =>
    this.pedir<{ nodo: Nodo; accion: string }>('POST', `/focos/${id}/nodos`, { padreId, tarjeta });
  historial = (id: number) => this.pedir<Historial>('GET', `/focos/${id}/historial`);

  notas = (nodo: number) => this.pedir<Nota[]>('GET', '/notas', undefined, { nodo });
  crearNota = (nodoId: number, texto: string) =>
    this.pedir<Nota>('POST', '/notas', { nodoId, texto });
  editarNota = (id: number, texto: string) => this.pedir<Nota>('PUT', `/notas/${id}`, { texto });
  eliminarNota = (id: number) => this.pedir<null>('DELETE', `/notas/${id}`);

  tokenPaypal = () =>
    this.pedir<{ clientToken: string; clientId: string }>('GET', '/donaciones/token-cliente');
  crearOrden = (monto: number) =>
    this.pedir<{ id: string; monto: number }>('POST', '/donaciones/orden', { monto });
  capturar = (id: string) =>
    this.pedir<{ id: string; estado: string; monto: number }>('POST', `/donaciones/${id}/captura`);
}
