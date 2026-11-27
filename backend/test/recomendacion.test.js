
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validarPregunta,
  calcularPuntaje,
  ordenarSubtemas,
  puedeCrearFoco,
} = require('../src/recomendacion');
const { relevancia, confiabilidad } = require('../src/relevancia');

test('PU-01 rechaza preguntas de menos de 3 caracteres', () => {
  assert.equal(validarPregunta('  ab ').ok, false);
});
test('PU-02 acepta una pregunta válida y la limpia', () => {
  assert.deepEqual(validarPregunta('  ¿Qué es un agujero negro? '), { ok: true, texto: '¿Qué es un agujero negro?' });
});
test('PU-03 rechaza preguntas de más de 200 caracteres', () => {
  assert.equal(validarPregunta('a'.repeat(201)).ok, false);
});
test('PU-04 calcula el puntaje 0.5R + 0.3C + 0.2N', () => {
  assert.equal(calcularPuntaje({ relevancia: 0.8, confiabilidad: 0.9, novedad: 1 }), 0.87);
});
test('PU-05 lanza error si un factor está fuera de 0 a 1', () => {
  assert.throws(() => calcularPuntaje({ relevancia: 1.2, confiabilidad: 0.5, novedad: 1 }), RangeError);
});
test('PU-06 un tema visitado baja en el orden (novedad 0)', () => {
  const lista = [
    { id: 'A', relevancia: 0.9, confiabilidad: 0.9 },
    { id: 'B', relevancia: 0.8, confiabilidad: 0.8 },
  ];
  assert.deepEqual(ordenarSubtemas(lista, new Set(['A'])).map((s) => s.id), ['B', 'A']);
});
test('PU-07 devuelve como máximo 5 subtemas', () => {
  const lista = Array.from({ length: 8 }, (_, i) => ({ id: 'T' + i, relevancia: 0.5, confiabilidad: 0.5 }));
  assert.equal(ordenarSubtemas(lista, new Set()).length, 5);
});
test('PU-08 permite crear foco con 4 activos y lo impide con 5', () => {
  assert.equal(puedeCrearFoco(4), true);
  assert.equal(puedeCrearFoco(5), false);
});

test('relevancia: coincide en título = 1, sin coincidencias = 0', () => {
  assert.equal(relevancia('¿Qué es un agujero negro?', { titulo: 'Agujero negro', resumen: '' }), 1);
  assert.equal(relevancia('agujero negro', { titulo: 'Fotosíntesis', resumen: 'plantas' }), 0);
  assert.equal(relevancia('agujero negro', { titulo: 'Agujero', resumen: 'estrella negro' }), 0.75);
});
test('confiabilidad: más citas = más confiable, nunca pasa de 1', () => {
  const poco = confiabilidad({ fuente: 'openalex', meta: { citas: 2 } });
  const mucho = confiabilidad({ fuente: 'openalex', meta: { citas: 5000 } });
  assert.ok(mucho > poco);
  assert.equal(mucho, 1);
  assert.equal(confiabilidad({ fuente: 'openlibrary', meta: { isbn: '123', ediciones: 20 } }), 1);
});
