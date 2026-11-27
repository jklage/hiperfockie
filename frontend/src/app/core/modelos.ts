
export type Fuente = 'wikipedia' | 'openalex' | 'openlibrary';

export interface Respuesta<T> { exito: boolean; mensaje: string; datos: T; }
export interface Usuario { id: number; nombre: string; correo: string; }
export interface Sesion { usuario: Usuario; token: string; }

export interface Tarjeta {
  titulo: string;
  resumen: string | null;
  fuente: Fuente;
  url: string;
  licencia: string;
  anio: number | null;
  autores: string[];
  portada: string | null;
  relevancia: number;
  confiabilidad: number;
  novedad: number;
  puntaje: number;
  visitado?: boolean;
}
export interface Aviso { fuente: Fuente | null; mensaje: string; }
export interface ResultadoBusqueda { pregunta: string; tarjetas: Tarjeta[]; avisos: Aviso[]; desdeCache: boolean; }

export interface Foco {
  id: number;
  tema: string;
  estado: 'activo' | 'archivado';
  creadoEn: string;
  temasVisitados: number;
  nivelMaximo: number;
  notas: number;
}
export interface Nodo {
  id: number;
  padreId: number | null;
  titulo: string;
  fuente: Fuente;
  url: string;
  resumen?: string | null;
  licencia: string;
  puntaje: number;
  nivel: number;
  visitadoEn?: string | null;
}
export interface Arbol { foco: Pick<Foco, 'id' | 'tema' | 'estado'>; nodos: Nodo[]; }
export interface Subtemas { nodo: { id: number; titulo: string; nivel: number; url: string }; subtemas: Tarjeta[]; avisos: Aviso[]; }
export interface Vineta {
  orden: number;
  accion: 'crear_foco' | 'visitar' | 'regresar' | 'anotar';
  fecha: string;
  nodoId: number;
  titulo: string;
  fuente: Fuente;
  url: string;
  licencia: string;
  nivel: number;
  resumen: string | null;
  notas: number;
  primeraNota: string | null;
}
export interface Historial { foco: Pick<Foco, 'id' | 'tema' | 'estado'>; vinetas: Vineta[]; }
export interface Nota { id: number; nodoId: number; texto: string; creadoEn: string; actualizadoEn: string | null; }

export const NOMBRE_FUENTE: Record<Fuente, string> = {
  wikipedia: 'Wikipedia',
  openalex: 'OpenAlex',
  openlibrary: 'Open Library',
};
