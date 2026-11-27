

const VACIAS = new Set(('a al ante con de del el en entre es la las lo los para por que qué se sin ' +
  'su sus un una unos y o como cómo cual cuál donde dónde cuando cuándo the of and in to is on for').split(' '));

function terminos(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9ñ]+/)
    .filter((t) => t.length > 2 && !VACIAS.has(t));
}

function relevancia(consulta, tarjeta) {
  const q = [...new Set(terminos(consulta))];
  if (q.length === 0) return 0;
  const enTitulo = new Set(terminos(tarjeta.titulo));
  const enResumen = new Set(terminos(tarjeta.resumen));
  let suma = 0;
  for (const t of q) {
    if (enTitulo.has(t)) suma += 1;
    else if (enResumen.has(t)) suma += 0.5;
  }
  return redondear(Math.min(1, suma / q.length));
}

const BASE = { wikipedia: 0.7, openalex: 0.6, openlibrary: 0.6 };
function confiabilidad(tarjeta) {
  const m = tarjeta.meta ?? {};
  let c = BASE[tarjeta.fuente] ?? 0.5;
  if (tarjeta.fuente === 'openalex') {

    c += 0.4 * Math.min(1, Math.log10((m.citas ?? 0) + 1) / 3);
  } else if (tarjeta.fuente === 'openlibrary') {
    if (m.isbn) c += 0.2;
    c += 0.2 * Math.min(1, (m.ediciones ?? 0) / 10);
  } else if (tarjeta.fuente === 'wikipedia') {
    if ((tarjeta.resumen ?? '').length > 120) c += 0.15;
  }
  return redondear(Math.min(1, c));
}

const redondear = (n) => Math.round(n * 100) / 100;

module.exports = { terminos, relevancia, confiabilidad };
