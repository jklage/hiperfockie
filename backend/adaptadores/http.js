

const LIMITE_MS = 5000;

function userAgent() {
  const contacto = process.env.CONTACTO_CORREO ? ` (${process.env.CONTACTO_CORREO})` : '';
  return `Hiperfockie/1.0${contacto}`;
}

async function obtenerJson(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': userAgent(), 'Api-User-Agent': userAgent(), Accept: 'application/json' },
    signal: AbortSignal.timeout(LIMITE_MS),
  });
  if (!r.ok) throw new Error(`${new URL(url).host} respondió ${r.status}`);
  return r.json();
}

const limpiarHtml = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();

module.exports = { obtenerJson, limpiarHtml, LIMITE_MS };
