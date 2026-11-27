
const { pool, transaccion } = require('../config/db');
const { HttpError } = require('../utils/respuesta');
const { MAX_FOCOS, MAX_NIVEL, MAX_SUBTEMAS, ordenarSubtemas } = require('../src/recomendacion');
const busqueda = require('./busqueda.service');

async function contarFocosActivos(usuarioId, con = pool) {
  const [f] = await con.execute(
    "SELECT COUNT(*) AS activos FROM focos WHERE usuario_id = ? AND estado = 'activo'",
    [usuarioId],
  );
  return Number(f[0].activos);
}

async function listar(usuarioId) {
  const [f] = await pool.execute(
    `SELECT f.id, f.tema_raiz AS tema, f.estado, f.creado_en AS creadoEn,
            (SELECT COUNT(*) FROM nodos n WHERE n.foco_id = f.id AND n.visitado_en IS NOT NULL) AS temasVisitados,
            (SELECT MAX(n.nivel) FROM nodos n WHERE n.foco_id = f.id) AS nivelMaximo,
            (SELECT COUNT(*) FROM notas x JOIN nodos n ON n.id = x.nodo_id WHERE n.foco_id = f.id) AS notas
     FROM focos f WHERE f.usuario_id = ?
     ORDER BY f.estado = 'activo' DESC, f.creado_en DESC`,
    [usuarioId],
  );
  return f;
}

async function obtener(focoId, usuarioId, con = pool) {
  const [f] = await con.execute(
    'SELECT id, usuario_id, tema_raiz AS tema, estado, creado_en AS creadoEn FROM focos WHERE id = ? AND usuario_id = ?',
    [focoId, usuarioId],
  );
  if (!f.length) throw new HttpError(404, 'No encontramos ese foco');
  return f[0];
}

async function crear(usuarioId, { tema, tarjeta }) {

  if (!tarjeta) {
    const { tarjetas } = await busqueda.buscar(tema);
    if (!tarjetas.length) throw new HttpError(404, 'No encontramos fuentes para ese tema');
    tarjeta = tarjetas.sort((a, b) => b.puntaje - a.puntaje)[0];
  }
  return transaccion(async (con) => {

    await con.execute('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [usuarioId]);
    if ((await contarFocosActivos(usuarioId, con)) >= MAX_FOCOS)
      throw new HttpError(409, 'Ya tienes 5 focos activos. Archiva uno para crear otro.');
    const [rf] = await con.execute('INSERT INTO focos (usuario_id, tema_raiz) VALUES (?, ?)', [usuarioId, tema]);
    const [rn] = await con.execute(
      `INSERT INTO nodos (foco_id, padre_id, titulo, fuente, url, extracto, licencia, puntaje, nivel, visitado_en)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [rf.insertId, tarjeta.titulo, tarjeta.fuente, tarjeta.url, tarjeta.resumen, tarjeta.licencia, tarjeta.puntaje],
    );
    await con.execute("INSERT INTO historial (foco_id, nodo_id, orden, accion) VALUES (?, ?, 1, 'crear_foco')", [rf.insertId, rn.insertId]);
    return { id: rf.insertId, tema, estado: 'activo', nodoRaizId: rn.insertId };
  });
}

async function cambiarEstado(focoId, usuarioId, estado) {
  return transaccion(async (con) => {
    await con.execute('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [usuarioId]);
    const foco = await obtener(focoId, usuarioId, con);
    if (foco.estado === estado) return { ...foco, estado };
    if (estado === 'activo' && (await contarFocosActivos(usuarioId, con)) >= MAX_FOCOS)
      throw new HttpError(409, 'Ya tienes 5 focos activos. Archiva uno para reactivar este.');
    await con.execute('UPDATE focos SET estado = ? WHERE id = ? AND usuario_id = ?', [estado, focoId, usuarioId]);
    return { id: foco.id, tema: foco.tema, estado };
  });
}

async function arbol(focoId, usuarioId) {
  const foco = await obtener(focoId, usuarioId);
  const [nodos] = await pool.execute(
    `SELECT id, padre_id AS padreId, titulo, fuente, url, extracto AS resumen, licencia,
            CAST(puntaje AS DOUBLE) AS puntaje, nivel, visitado_en AS visitadoEn
     FROM nodos WHERE foco_id = ? ORDER BY nivel, puntaje DESC`,
    [focoId],
  );
  return { foco: { id: foco.id, tema: foco.tema, estado: foco.estado }, nodos };
}

async function subtemas(focoId, usuarioId, nodoId) {
  const foco = await obtener(focoId, usuarioId);
  const [n] = nodoId
    ? await pool.execute('SELECT id, titulo, nivel, url FROM nodos WHERE id = ? AND foco_id = ?', [nodoId, focoId])
    : await pool.execute(
        `SELECT n.id, n.titulo, n.nivel, n.url FROM historial h JOIN nodos n ON n.id = h.nodo_id
         WHERE h.foco_id = ? ORDER BY h.orden DESC LIMIT 1`,
        [focoId],
      );
  if (!n.length) throw new HttpError(404, 'No encontramos ese tema en el foco');
  const nodo = n[0];
  if (nodo.nivel >= MAX_NIVEL)
    return { nodo, subtemas: [], avisos: [{ fuente: null, mensaje: 'Llegaste al nivel 5, el máximo de la madriguera' }] };

  const [v] = await pool.execute('SELECT url FROM nodos WHERE foco_id = ? AND visitado_en IS NOT NULL', [focoId]);
  const visitados = new Set(v.map((x) => x.url));
  const r = await busqueda.buscar(nodo.titulo, { contexto: `${foco.tema} ${nodo.titulo}`, visitados });
  const candidatos = r.tarjetas
    .filter((t) => t.url !== nodo.url)
    .map((t) => ({ ...t, id: t.url }));
  const lista = ordenarSubtemas(candidatos, visitados)
    .slice(0, MAX_SUBTEMAS)
    .map(({ id, ...t }) => ({ ...t, novedad: visitados.has(id) ? 0 : 1, visitado: visitados.has(id) }));
  return { nodo, subtemas: lista, avisos: r.avisos };
}

async function avanzar(focoId, usuarioId, { padreId, tarjeta }) {
  return transaccion(async (con) => {
    const foco = await obtener(focoId, usuarioId, con);
    if (foco.estado !== 'activo') throw new HttpError(409, 'Reactiva el foco para seguir explorando');
    const [p] = await con.execute('SELECT id, nivel FROM nodos WHERE id = ? AND foco_id = ? FOR UPDATE', [padreId, focoId]);
    if (!p.length) throw new HttpError(404, 'No encontramos el tema de origen');

    let nodoId;
    let accion = 'visitar';
    const [existe] = await con.execute('SELECT id FROM nodos WHERE foco_id = ? AND url = ? LIMIT 1', [focoId, tarjeta.url]);
    if (existe.length) {
      nodoId = existe[0].id;
      accion = 'regresar';
      await con.execute('UPDATE nodos SET visitado_en = NOW() WHERE id = ?', [nodoId]);
    } else {
      const nivel = p[0].nivel + 1;
      if (nivel > MAX_NIVEL) throw new HttpError(400, 'La madriguera llega como máximo al nivel 5');
      const [h] = await con.execute('SELECT COUNT(*) AS hijos FROM nodos WHERE padre_id = ?', [padreId]);
      if (Number(h[0].hijos) >= MAX_SUBTEMAS) throw new HttpError(409, 'Este tema ya tiene 5 subtemas explorados');
      const [r] = await con.execute(
        `INSERT INTO nodos (foco_id, padre_id, titulo, fuente, url, extracto, licencia, puntaje, nivel, visitado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [focoId, padreId, tarjeta.titulo, tarjeta.fuente, tarjeta.url, tarjeta.resumen, tarjeta.licencia, tarjeta.puntaje, nivel],
      );
      nodoId = r.insertId;
    }
    await con.execute(
      `INSERT INTO historial (foco_id, nodo_id, orden, accion)
       SELECT ?, ?, COALESCE(MAX(orden), 0) + 1, ? FROM historial WHERE foco_id = ?`,
      [focoId, nodoId, accion, focoId],
    );
    const [n] = await con.execute(
      'SELECT id, padre_id AS padreId, titulo, fuente, url, licencia, CAST(puntaje AS DOUBLE) AS puntaje, nivel FROM nodos WHERE id = ?',
      [nodoId],
    );
    return { nodo: n[0], accion };
  });
}

async function historial(focoId, usuarioId) {
  const foco = await obtener(focoId, usuarioId);
  const [v] = await pool.execute(
    `SELECT h.orden, h.accion, h.creado_en AS fecha, n.id AS nodoId, n.titulo, n.fuente, n.url,
            n.licencia, n.nivel, n.extracto AS resumen,
            (SELECT COUNT(*) FROM notas x WHERE x.nodo_id = n.id) AS notas,
            (SELECT x.texto FROM notas x WHERE x.nodo_id = n.id ORDER BY x.creado_en LIMIT 1) AS primeraNota
     FROM historial h JOIN nodos n ON n.id = h.nodo_id
     WHERE h.foco_id = ? ORDER BY h.orden`,
    [focoId],
  );
  return { foco: { id: foco.id, tema: foco.tema, estado: foco.estado }, vinetas: v };
}

module.exports = { contarFocosActivos, listar, obtener, crear, cambiarEstado, arbol, subtemas, avanzar, historial };
