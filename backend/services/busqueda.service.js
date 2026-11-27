
const adaptadores = require('../adaptadores');
const cache = require('./cache.service');
const { relevancia, confiabilidad } = require('../src/relevancia');
const { calcularPuntaje } = require('../src/recomendacion');

const NOMBRES = { wikipedia: 'Wikipedia', openalex: 'OpenAlex', openlibrary: 'Open Library' };

async function desdeFuente(fuente, q) {
  const guardado = await cache.leer(fuente, q);
  if (guardado) return { tarjetas: guardado, cache: true };
  const tarjetas = await adaptadores[fuente].buscar(q);
  await cache.guardar(fuente, q, tarjetas);
  return { tarjetas, cache: false };
}

async function buscar(q, { contexto = q, visitados = new Set() } = {}) {
  const fuentes = Object.keys(adaptadores);
  const resultados = await Promise.allSettled(fuentes.map((f) => desdeFuente(f, q)));
  const tarjetas = [];
  const avisos = [];
  let desdeCache = true;
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      if (!r.value.cache) desdeCache = false;
      tarjetas.push(...r.value.tarjetas);
    } else {
      desdeCache = false;
      console.warn(`[FUENTE] ${fuentes[i]}: ${r.reason?.message}`);
      avisos.push({ fuente: fuentes[i], mensaje: `${NOMBRES[fuentes[i]]} no está disponible en este momento` });
    }
  });
  const puntuadas = tarjetas.map((t) => {
    const factores = {
      relevancia: relevancia(contexto, t),
      confiabilidad: confiabilidad(t),
      novedad: visitados.has(t.url) ? 0 : 1,
    };
    const { meta, ...publica } = t;
    return { ...publica, ...factores, puntaje: calcularPuntaje(factores) };
  });
  return { tarjetas: puntuadas, avisos, desdeCache };
}

module.exports = { buscar };
