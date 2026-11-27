

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const adaptadores = require('../adaptadores');
const paypal = require('../services/paypal.service');
const app = require('../app');
const { pool } = require('../config/db');

let llamadas = 0;
const tarjeta = (fuente, titulo, url, extra = {}) => ({
  titulo, resumen: `Resumen de ${titulo}`, fuente, url, licencia: fuente === 'wikipedia' ? 'CC BY-SA 4.0' : 'Metadatos CC0',
  anio: null, autores: [], portada: null, meta: {}, ...extra,
});
adaptadores.wikipedia.buscar = async (q) => {
  llamadas++;
  return [1, 2, 3].map((i) => tarjeta('wikipedia', `${q} ${i}`, `https://es.wikipedia.org/wiki/${encodeURIComponent(q)}_${i}`));
};
adaptadores.openalex.buscar = async (q) => {
  llamadas++;
  return [tarjeta('openalex', `${q} paper`, `https://openalex.org/W${crypto.randomInt(1e9)}`, { meta: { citas: 300 } })];
};
let openLibraryCaida = false;
adaptadores.openlibrary.buscar = async (q) => {
  llamadas++;
  if (openLibraryCaida) throw new Error('timeout');
  return [tarjeta('openlibrary', `${q} libro`, 'https://openlibrary.org/works/OL1W', { meta: { isbn: '1', ediciones: 3 } })];
};
let ordenes = {};
paypal.crearOrden = async (monto) => { const id = 'TEST' + crypto.randomBytes(6).toString('hex').toUpperCase(); ordenes[id] = monto; return { id, status: 'CREATED' }; };
paypal.tokenCliente = async () => 'token-cliente-prueba';
paypal.capturarOrden = async (id) => ({
  id, status: 'COMPLETED',
  purchase_units: [{ payments: { captures: [{ status: 'COMPLETED', amount: { value: ordenes[id].toFixed(2) } }] } }],
});

let base, servidor;
const pedir = async (metodo, ruta, { token, cuerpo } = {}) => {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { status: r.status, body: await r.json() };
};
const entrar = async (correo) => (await pedir('POST', '/api/auth/login', { cuerpo: { correo, password: 'Hiperfockie2026' } })).body.datos.token;

test.before(async () => {
  servidor = app.listen(0);
  base = `http://127.0.0.1:${servidor.address().port}`;
});
test.after(async () => { servidor.close(); await pool.end(); });

const nuevo = { nombre: 'Prueba', correo: `prueba${Date.now()}@x.mx`, password: 'secreta123', aceptoAviso: true };

test('PI-01 registro válido -> 201 con token', async () => {
  const r = await pedir('POST', '/api/auth/registro', { cuerpo: nuevo });
  assert.equal(r.status, 201);
  assert.equal(r.body.exito, true);
  assert.ok(r.body.datos.token);
});
test('PI-02 correo ya registrado -> 409', async () => {
  const r = await pedir('POST', '/api/auth/registro', { cuerpo: { ...nuevo, correo: 'YAEL@hiperfockie.test' } });
  assert.equal(r.status, 409);
  assert.equal(r.body.mensaje, 'El correo ya está registrado');
});
test('PI-03 sin aceptar aviso -> 400', async () => {
  const r = await pedir('POST', '/api/auth/registro', { cuerpo: { ...nuevo, aceptoAviso: false } });
  assert.equal(r.status, 400);
});
test('PI-04 credenciales correctas -> 200 con token', async () => {
  const r = await pedir('POST', '/api/auth/login', { cuerpo: { correo: 'yael@hiperfockie.test', password: 'Hiperfockie2026' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.datos.usuario.nombre, 'Yael Pérez');
});
test('PI-05 contraseña incorrecta -> 401', async () => {
  const r = await pedir('POST', '/api/auth/login', { cuerpo: { correo: 'yael@hiperfockie.test', password: 'mala12345' } });
  assert.equal(r.status, 401);
});
test("PS-02 inyección ' OR 1=1 -- en el login -> 401", async () => {
  const r = await pedir('POST', '/api/auth/login', { cuerpo: { correo: "' OR 1=1 --", password: "' OR 1=1 --" } });
  assert.equal(r.status, 401);
  assert.equal(r.body.exito, false);
});
test('PS-03 6 intentos fallidos -> bloqueo de 15 min', async () => {
  const cuerpo = { correo: nuevo.correo, password: 'incorrecta' };
  for (let i = 0; i < 5; i++) assert.equal((await pedir('POST', '/api/auth/login', { cuerpo })).status, 401);
  const r = await pedir('POST', '/api/auth/login', { cuerpo: { ...cuerpo, password: nuevo.password } });
  assert.equal(r.status, 401);
  assert.match(r.body.mensaje, /Intenta de nuevo en 15 min/);
});
test('PS-01 contraseñas guardadas como hash bcrypt', async () => {
  const [f] = await pool.query('SELECT password_hash FROM usuarios');
  assert.ok(f.every((u) => /^\$2[aby]\$12\$/.test(u.password_hash)));
});
test('PI-06 sin token o token vencido -> 401', async () => {
  assert.equal((await pedir('GET', '/api/focos')).status, 401);
  const jwt = require('jsonwebtoken');
  const vencido = jwt.sign({ id: 1 }, process.env.JWT_SECRETO, { expiresIn: -10 });
  assert.equal((await pedir('GET', '/api/focos', { token: vencido })).status, 401);
});

test('PI-07 búsqueda válida -> tarjetas de las 3 fuentes con puntaje', async () => {
  const t = await entrar('yael@hiperfockie.test');
  const r = await pedir('GET', '/api/busqueda?q=' + encodeURIComponent('¿Qué es un pulsar?'), { token: t });
  assert.equal(r.status, 200);
  const fuentes = new Set(r.body.datos.tarjetas.map((x) => x.fuente));
  assert.deepEqual([...fuentes].sort(), ['openalex', 'openlibrary', 'wikipedia']);
  for (const x of r.body.datos.tarjetas) {
    assert.ok(x.fuente && x.url && x.licencia, 'PN-03 fuente, enlace y licencia');
    assert.ok(x.puntaje >= 0 && x.puntaje <= 1);
  }
  assert.equal(r.body.datos.desdeCache, false);
});
test('PI-08 misma pregunta -> desde caché, sin llamar a las fuentes', async () => {
  const t = await entrar('yael@hiperfockie.test');
  const antes = llamadas;
  const inicio = Date.now();
  const r = await pedir('GET', '/api/busqueda?q=' + encodeURIComponent('¿Qué es un   PULSAR?'), { token: t });
  assert.equal(r.body.datos.desdeCache, true);
  assert.equal(llamadas, antes);
  assert.ok(Date.now() - inicio < 1000);
});
test('PI-09 una fuente apagada -> 200 con aviso y las otras dos', async () => {
  const t = await entrar('yael@hiperfockie.test');
  openLibraryCaida = true;
  const r = await pedir('GET', '/api/busqueda?q=magnetar', { token: t });
  openLibraryCaida = false;
  assert.equal(r.status, 200);
  assert.equal(r.body.datos.avisos[0].fuente, 'openlibrary');
  assert.ok(r.body.datos.tarjetas.length > 0);
});
test('RQNF7 pregunta de 2 caracteres -> 400', async () => {
  const t = await entrar('yael@hiperfockie.test');
  assert.equal((await pedir('GET', '/api/busqueda?q=ab', { token: t })).status, 400);
});

test('PI-10 usuario con 4 focos crea uno -> 201', async () => {
  const t = await entrar('yael@hiperfockie.test');
  const r = await pedir('POST', '/api/focos', { token: t, cuerpo: { tema: 'Estrellas de neutrones' } });
  assert.equal(r.status, 201);
  assert.ok(r.body.datos.nodoRaizId);
});
test('PI-11 usuario con 5 focos -> 409 (también Yael ahora)', async () => {
  for (const c of ['carlos@hiperfockie.test', 'yael@hiperfockie.test']) {
    const r = await pedir('POST', '/api/focos', { token: await entrar(c), cuerpo: { tema: 'Un sexto foco' } });
    assert.equal(r.status, 409);
    assert.match(r.body.mensaje, /Archiva uno/);
  }
});
test('PI-12 archivar libera un lugar; reactivar con 5 -> 409', async () => {
  const t = await entrar('carlos@hiperfockie.test');
  assert.equal((await pedir('PATCH', '/api/focos/10', { token: t, cuerpo: { estado: 'archivado' } })).status, 200);
  assert.equal((await pedir('POST', '/api/focos', { token: t, cuerpo: { tema: 'Volcanes' } })).status, 201);
  assert.equal((await pedir('PATCH', '/api/focos/10', { token: t, cuerpo: { estado: 'activo' } })).status, 409);
});
test('foco ajeno -> 404', async () => {
  const t = await entrar('carlos@hiperfockie.test');
  assert.equal((await pedir('GET', '/api/focos/1/arbol', { token: t })).status, 404);
});

test('PI-13 subtemas: máximo 5, ordenados por puntaje', async () => {
  const t = await entrar('yael@hiperfockie.test');
  const r = await pedir('GET', '/api/focos/1/subtemas', { token: t });
  assert.equal(r.status, 200);
  const s = r.body.datos.subtemas;
  assert.ok(s.length > 0 && s.length <= 5);
  for (let i = 1; i < s.length; i++) assert.ok(s[i - 1].puntaje >= s[i].puntaje);
  assert.equal(r.body.datos.nodo.titulo, 'Relatividad general');
  const h = await pedir('GET', '/api/focos/1/historial', { token: t });
  assert.match(h.body.datos.vinetas[0].primeraNota, /Nota del foco/);
  const l = await pedir('GET', '/api/focos', { token: t });
  assert.equal(l.body.datos.find((f) => f.id === 1).notas, 3);
});
test('PA-04 explorar niveles: avanzar hasta el 5 y el 6 se rechaza', async () => {
  const t = await entrar('yael@hiperfockie.test');

  let padreId = 5;
  for (const nivel of [4, 5]) {
    const r = await pedir('POST', '/api/focos/1/nodos', { token: t, cuerpo: { padreId, tarjeta: { titulo: `Tema ${nivel}`, fuente: 'wikipedia', url: `https://es.wikipedia.org/wiki/Tema_${nivel}`, licencia: 'CC BY-SA 4.0', puntaje: 0.8 } } });
    assert.equal(r.status, 201);
    assert.equal(r.body.datos.nodo.nivel, nivel);
    padreId = r.body.datos.nodo.id;
  }
  const r6 = await pedir('POST', '/api/focos/1/nodos', { token: t, cuerpo: { padreId, tarjeta: { titulo: 'Tema 6', fuente: 'wikipedia', url: 'https://es.wikipedia.org/wiki/Tema_6', licencia: 'CC BY-SA 4.0' } } });
  assert.equal(r6.status, 400);
  const s = await pedir('GET', `/api/focos/1/subtemas?nodo=${padreId}`, { token: t });
  assert.equal(s.body.datos.subtemas.length, 0);

  const h = await pedir('GET', '/api/focos/1/historial', { token: t });
  assert.deepEqual(h.body.datos.vinetas.map((v) => v.orden), [1, 2, 3, 4, 5]);
  const a = await pedir('GET', '/api/focos/1/arbol', { token: t });
  assert.equal(Math.max(...a.body.datos.nodos.map((n) => n.nivel)), 5);
});
test('volver a un tema ya visitado -> viñeta "regresar"', async () => {
  const t = await entrar('yael@hiperfockie.test');
  const r = await pedir('POST', '/api/focos/1/nodos', { token: t, cuerpo: { padreId: 1, tarjeta: { titulo: 'Agujero negro', fuente: 'wikipedia', url: 'https://es.wikipedia.org/wiki/Agujero_negro', licencia: 'CC BY-SA 4.0' } } });
  assert.equal(r.status, 201);
  assert.equal(r.body.datos.accion, 'regresar');
});
test('tarjeta de fuente no permitida -> 400', async () => {
  const t = await entrar('yael@hiperfockie.test');
  const r = await pedir('POST', '/api/focos/1/nodos', { token: t, cuerpo: { padreId: 1, tarjeta: { titulo: 'X', fuente: 'google', url: 'https://google.com', licencia: 'x' } } });
  assert.equal(r.status, 400);
});

test('PI-14 notas: crear 201, editar 200, eliminar 200', async () => {
  const t = await entrar('yael@hiperfockie.test');
  const c = await pedir('POST', '/api/notas', { token: t, cuerpo: { nodoId: 2, texto: 'Mi nota' } });
  assert.equal(c.status, 201);
  const id = c.body.datos.id;
  const e = await pedir('PUT', `/api/notas/${id}`, { token: t, cuerpo: { texto: 'Editada' } });
  assert.equal(e.status, 200);
  assert.equal(e.body.datos.texto, 'Editada');
  assert.ok(e.body.datos.actualizadoEn);
  assert.equal((await pedir('DELETE', `/api/notas/${id}`, { token: t })).status, 200);
  assert.equal((await pedir('DELETE', `/api/notas/${id}`, { token: t })).status, 404);
});
test('nota en tarjeta ajena -> 404', async () => {
  const t = await entrar('carlos@hiperfockie.test');
  assert.equal((await pedir('POST', '/api/notas', { token: t, cuerpo: { nodoId: 2, texto: 'intruso' } })).status, 404);
});

test('PI-15 recuperar con correo registrado -> 200', async () => {
  const r = await pedir('POST', '/api/auth/recuperar', { cuerpo: { correo: 'nuevo@hiperfockie.test' } });
  assert.equal(r.status, 200);
  const [f] = await pool.query("SELECT COUNT(*) n FROM tokens_recuperacion t JOIN usuarios u ON u.id=t.usuario_id WHERE u.correo='nuevo@hiperfockie.test' AND usado = FALSE");
  assert.equal(Number(f[0].n), 1);
});
test('PI-16 enlace ya usado -> 400; válido -> 200 y solo una vez', async () => {
  const usado = crypto.createHash('sha256').update('token-demo-usado').digest('hex');
  const r = await pedir('POST', '/api/auth/restablecer', { cuerpo: { token: usado, password: 'nuevaclave1' } });
  assert.equal(r.status, 400);

  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await pool.execute('INSERT INTO tokens_recuperacion (usuario_id, token_hash, expira_en) VALUES (3, ?, NOW() + INTERVAL 30 MINUTE)', [hash]);
  assert.equal((await pedir('POST', '/api/auth/restablecer', { cuerpo: { token, password: 'nuevaclave1' } })).status, 200);
  assert.equal((await pedir('POST', '/api/auth/restablecer', { cuerpo: { token, password: 'otraclave1' } })).status, 400);
  assert.equal((await pedir('POST', '/api/auth/login', { cuerpo: { correo: 'nuevo@hiperfockie.test', password: 'nuevaclave1' } })).status, 200);
});

test('token de cliente para el SDK v6 -> 200', async () => {
  const t = await entrar('yael@hiperfockie.test');
  const r = await pedir('GET', '/api/donaciones/token-cliente', { token: t });
  assert.equal(r.status, 200);
  assert.equal(r.body.datos.clientToken, 'token-cliente-prueba');
});
test('PI-17 crear orden de $100 -> 201 con id', async () => {
  const t = await entrar('yael@hiperfockie.test');
  const r = await pedir('POST', '/api/donaciones/orden', { token: t, cuerpo: { monto: 100 } });
  assert.equal(r.status, 201);
  assert.ok(r.body.datos.id);
});
test('PS-04 monto alterado o inválido -> 400', async () => {
  const t = await entrar('yael@hiperfockie.test');
  for (const monto of [-100, 0, 'cien', '100; DROP TABLE donaciones']) {
    assert.equal((await pedir('POST', '/api/donaciones/orden', { token: t, cuerpo: { monto } })).status, 400);
  }
});
test('PI-18 capturar orden aprobada -> 200 y donación COMPLETED', async () => {
  const t = await entrar('yael@hiperfockie.test');
  const o = await pedir('POST', '/api/donaciones/orden', { token: t, cuerpo: { monto: 50 } });
  const r = await pedir('POST', `/api/donaciones/${o.body.datos.id}/captura`, { token: t });
  assert.equal(r.status, 200);
  const [f] = await pool.execute('SELECT estado, monto FROM donaciones WHERE paypal_order_id = ?', [o.body.datos.id]);
  assert.equal(f[0].estado, 'COMPLETED');
  assert.equal(Number(f[0].monto), 50);
});
test('ruta inexistente -> 404 con forma { exito, mensaje, datos }', async () => {
  const r = await pedir('POST', '/api/auth/nada');
  assert.equal(r.status, 404);
  assert.deepEqual(Object.keys(r.body), ['exito', 'mensaje', 'datos']);
});
