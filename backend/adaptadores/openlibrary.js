
const { obtenerJson } = require('./http');

const CAMPOS = 'key,title,author_name,first_publish_year,cover_i,isbn,edition_count';
let ultima = 0;

async function turno() {
  const espera = Math.max(0, ultima + 1000 - Date.now());
  ultima = Date.now() + espera;
  if (espera) await new Promise((r) => setTimeout(r, espera));
}

async function buscar(q) {
  await turno();
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=${CAMPOS}&limit=5`;
  const datos = await obtenerJson(url);
  return (datos.docs ?? []).map((d) => {
    const autores = (d.author_name ?? []).slice(0, 3);
    return {
      titulo: d.title,
      resumen: `${autores.join(', ') || 'Autor desconocido'}${d.first_publish_year ? `, ${d.first_publish_year}` : ''}. ${d.edition_count ?? 1} ediciones.`,
      fuente: 'openlibrary',
      url: `https://openlibrary.org${d.key}`,
      licencia: 'Metadatos CC0',
      anio: d.first_publish_year ?? null,
      autores,
      portada: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
      meta: { isbn: d.isbn?.[0] ?? null, ediciones: d.edition_count ?? 0 },
    };
  });
}

module.exports = { nombre: 'openlibrary', buscar };
