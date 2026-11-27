

const test = require('node:test');
const assert = require('node:assert/strict');
const wikipedia = require('../adaptadores/wikipedia');
const openalex = require('../adaptadores/openalex');
const openlibrary = require('../adaptadores/openlibrary');

let ultimaUrl;
const responderCon = (json, status = 200) => {
  global.fetch = async (url, op) => {
    ultimaUrl = String(url);
    assert.match(op.headers['User-Agent'], /^Hiperfockie/);
    assert.ok(op.signal, 'cada petición lleva límite de 5 s');
    return { ok: status < 400, status, json: async () => json };
  };
};
const CAMPOS = ['titulo', 'resumen', 'fuente', 'url', 'licencia', 'anio', 'autores'];

test('Wikipedia: REST search/page en español', async () => {
  responderCon({ pages: [{ id: 1, key: 'Agujero_negro', title: 'Agujero negro', excerpt: 'Un <span class="searchmatch">agujero</span> negro es', description: 'región del espacio', thumbnail: { url: '//upload.wikimedia.org/x.jpg' } }] });
  const [t] = await wikipedia.buscar('agujero negro');
  assert.match(ultimaUrl, /^https:\/\/es\.wikipedia\.org\/w\/rest\.php\/v1\/search\/page\?q=agujero%20negro&limit=5$/);
  for (const c of CAMPOS) assert.ok(c in t, c);
  assert.equal(t.url, 'https://es.wikipedia.org/wiki/Agujero_negro');
  assert.equal(t.resumen, 'región del espacio. Un agujero negro es');
  assert.equal(t.licencia, 'CC BY-SA 4.0');
});

test('OpenAlex: /works con search, per_page=5, select y api_key', async () => {
  process.env.OPENALEX_API_KEY = 'clave';
  responderCon({ results: [{ id: 'https://openalex.org/W1', display_name: 'Black holes', publication_year: 1974, cited_by_count: 9000, authorships: [{ author: { display_name: 'S. Hawking' } }], abstract_inverted_index: { Black: [0], holes: [1], radiate: [2] } }] });
  const [t] = await openalex.buscar('black holes');
  const u = new URL(ultimaUrl);
  assert.equal(u.pathname, '/works');
  assert.equal(u.searchParams.get('per_page'), '5');
  assert.equal(u.searchParams.get('api_key'), 'clave');
  assert.ok(u.searchParams.get('select').includes('cited_by_count'));
  assert.equal(t.resumen, 'Black holes radiate');
  assert.deepEqual(t.autores, ['S. Hawking']);
  assert.equal(t.meta.citas, 9000);
});

test('Open Library: search.json, portada y 1 petición por segundo', async () => {
  responderCon({ docs: [{ key: '/works/OL1W', title: 'Cosmos', author_name: ['Carl Sagan'], first_publish_year: 1980, cover_i: 42, isbn: ['123'], edition_count: 30 }] });
  const inicio = Date.now();
  await openlibrary.buscar('cosmos');
  const [t] = await openlibrary.buscar('cosmos');
  assert.ok(Date.now() - inicio >= 990, 'la segunda petición espera 1 s');
  assert.equal(t.url, 'https://openlibrary.org/works/OL1W');
  assert.equal(t.portada, 'https://covers.openlibrary.org/b/id/42-M.jpg');
  assert.equal(t.resumen, 'Carl Sagan, 1980. 30 ediciones.');
});

test('una API con error lanza excepción (la búsqueda lo convierte en aviso)', async () => {
  responderCon({}, 503);
  await assert.rejects(wikipedia.buscar('x'), /503/);
});
