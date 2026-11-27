
export function hace(fecha: string | Date): string {
  const s = (Date.now() - new Date(fecha).getTime()) / 1000;
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}
export const hora = (f: string) => new Date(f).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
export const fechaCorta = (f: string) => new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' });
export const dos = (n: number) => String(n).padStart(2, '0');
export const dominio = (url: string) => { try { return new URL(url).host; } catch { return url; } };
