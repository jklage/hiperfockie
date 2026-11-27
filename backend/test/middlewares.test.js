
const test = require('node:test');
const assert = require('node:assert/strict');
const limiteFocos = require('../middlewares/limiteFocos');
const v = require('../middlewares/validar');

const resFalsa = () => {
  const r = { codigo: null, cuerpo: null };
  r.status = (c) => { r.codigo = c; return r; };
  r.json = (b) => { r.cuerpo = b; return r; };
  return r;
};

test('PU-09 middleware con 4 focos llama a next()', async () => {
  let llamado = false;
  await limiteFocos(async () => 4)({ method: 'POST', usuario: { id: 1 } }, resFalsa(), () => { llamado = true; });
  assert.equal(llamado, true);
});
test('PU-10 middleware con 5 focos responde 409', async () => {
  const res = resFalsa();
  let llamado = false;
  await limiteFocos(async () => 5)({ method: 'POST', usuario: { id: 1 } }, res, () => { llamado = true; });
  assert.equal(llamado, false);
  assert.equal(res.codigo, 409);
  assert.equal(res.cuerpo.exito, false);
});
test('archivar (PATCH estado archivado) no se bloquea con 5 activos', async () => {
  let llamado = false;
  await limiteFocos(async () => 5)({ method: 'PATCH', body: { estado: 'archivado' }, usuario: { id: 1 } }, resFalsa(), () => { llamado = true; });
  assert.equal(llamado, true);
});

const correr = (mw, body) => { const req = { body, method: 'POST' }; mw(req, null, () => {}); return req.body; };
test('RQNF8 monto: solo números mayores a cero', () => {
  assert.equal(correr(v.monto, { monto: 100 }).monto, 100);
  assert.equal(correr(v.monto, { monto: '50.50' }).monto, 50.5);
  for (const m of [0, -5, 'abc', '1e3', '10.999', 20000, null]) assert.throws(() => correr(v.monto, { monto: m }), { status: 400 });
});
test('RQNF4-6 registro: vacíos, correo, 8 caracteres y aviso', () => {
  const ok = { nombre: 'Ana', correo: 'ANA@x.mx', password: '12345678', aceptoAviso: true };
  assert.equal(correr(v.registro, ok).correo, 'ana@x.mx');
  assert.throws(() => correr(v.registro, { ...ok, nombre: ' ' }), { status: 400 });
  assert.throws(() => correr(v.registro, { ...ok, correo: 'ana@' }), { status: 400 });
  assert.throws(() => correr(v.registro, { ...ok, password: '1234567' }), { status: 400 });
  assert.throws(() => correr(v.registro, { ...ok, aceptoAviso: false }), { status: 400 });
});
test('RQNF23 tarjeta: solo fuentes de la lista blanca y su dominio', () => {
  const t = { titulo: 'X', fuente: 'wikipedia', url: 'https://es.wikipedia.org/wiki/X', licencia: 'CC BY-SA 4.0' };
  assert.equal(v.tarjeta(t).fuente, 'wikipedia');
  assert.throws(() => v.tarjeta({ ...t, fuente: 'google' }), { status: 400 });
  assert.throws(() => v.tarjeta({ ...t, url: 'https://malicioso.com/x' }), { status: 400 });
});
