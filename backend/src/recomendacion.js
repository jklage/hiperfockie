

const PESOS = { relevancia: 0.5, confiabilidad: 0.3, novedad: 0.2 };
const MAX_SUBTEMAS = 5;
const MAX_FOCOS = 5;
const MAX_NIVEL = 5;

function validarPregunta(texto) {
  const limpio = String(texto ?? '').trim();
  if (limpio.length < 3 || limpio.length > 200) {
    return { ok: false, error: 'La pregunta debe tener entre 3 y 200 caracteres' };
  }
  return { ok: true, texto: limpio };
}

function calcularPuntaje({ relevancia, confiabilidad, novedad }) {
  for (const v of [relevancia, confiabilidad, novedad]) {
    if (typeof v !== 'number' || v < 0 || v > 1)
      throw new RangeError('Cada factor debe estar entre 0 y 1');
  }
  const total =
    PESOS.relevancia * relevancia +
    PESOS.confiabilidad * confiabilidad +
    PESOS.novedad * novedad;
  return Math.round(total * 100) / 100;
}

function ordenarSubtemas(subtemas, visitados) {
  return subtemas
    .map((s) => ({
      ...s,
      puntaje: calcularPuntaje({ ...s, novedad: visitados.has(s.id) ? 0 : 1 }),
    }))
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, MAX_SUBTEMAS);
}

const puedeCrearFoco = (focosActivos) => focosActivos < MAX_FOCOS;

module.exports = {
  PESOS,
  MAX_SUBTEMAS,
  MAX_FOCOS,
  MAX_NIVEL,
  validarPregunta,
  calcularPuntaje,
  ordenarSubtemas,
  puedeCrearFoco,
};
