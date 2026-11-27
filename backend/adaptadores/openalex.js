
const { obtenerJson } = require('./http');

const CAMPOS = 'id,doi,display_name,publication_year,cited_by_count,authorships,abstract_inverted_index';

function reconstruirResumen(indice) {
  if (!indice) return '';
  const palabras = [];
  for (const [p, posiciones] of Object.entries(indice)) for (const i of posiciones) palabras[i] = p;
  const texto = palabras.filter(Boolean).join(' ');
  return texto.length > 400 ? texto.slice(0, 400).replace(/\s\S*$/, '') + '…' : texto;
}

async function buscar(q) {
  const params = new URLSearchParams({ search: q, per_page: '5', select: CAMPOS });
  if (process.env.OPENALEX_API_KEY) params.set('api_key', process.env.OPENALEX_API_KEY);
  const datos = await obtenerJson(`https://api.openalex.org/works?${params}`);
  return (datos.results ?? []).map((w) => {
    const autores = (w.authorships ?? []).slice(0, 3).map((a) => a.author?.display_name).filter(Boolean);
    return {
      titulo: w.display_name ?? 'Sin título',
      resumen: reconstruirResumen(w.abstract_inverted_index) ||
        `${autores.join(', ') || 'Autor desconocido'}${w.publication_year ? `, ${w.publication_year}` : ''}. ${w.cited_by_count ?? 0} citas.`,
      fuente: 'openalex',
      url: w.id,
      licencia: 'Metadatos CC0',
      anio: w.publication_year ?? null,
      autores,
      portada: null,
      meta: { citas: w.cited_by_count ?? 0, doi: w.doi ?? null },
    };
  });
}

module.exports = { nombre: 'openalex', buscar, reconstruirResumen };
