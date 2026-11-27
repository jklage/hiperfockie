
const { obtenerJson, limpiarHtml } = require('./http');

async function buscar(q) {
  const url = `https://es.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=5`;
  const datos = await obtenerJson(url);
  return (datos.pages ?? []).map((p) => ({
    titulo: p.title,
    resumen: limpiarHtml([p.description, p.excerpt].filter(Boolean).join('. ')),
    fuente: 'wikipedia',
    url: `https://es.wikipedia.org/wiki/${encodeURIComponent(p.key)}`,
    licencia: 'CC BY-SA 4.0',
    anio: null,
    autores: [],
    portada: p.thumbnail?.url ? `https:${p.thumbnail.url}` : null,
    meta: {},
  }));
}

module.exports = { nombre: 'wikipedia', buscar };
