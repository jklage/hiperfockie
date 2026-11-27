
const { pool } = require('../config/db');
const { HttpError } = require('../utils/respuesta');

const CAMPOS = 'id, nodo_id AS nodoId, texto, creado_en AS creadoEn, actualizado_en AS actualizadoEn';

async function listar(usuarioId, nodoId) {
  const [f] = await pool.execute(`SELECT ${CAMPOS} FROM notas WHERE nodo_id = ? AND usuario_id = ? ORDER BY creado_en`, [nodoId, usuarioId]);
  return f;
}

async function crear(usuarioId, { nodoId, texto }) {

  const [n] = await pool.execute(
    'SELECT n.id FROM nodos n JOIN focos f ON f.id = n.foco_id WHERE n.id = ? AND f.usuario_id = ?',
    [nodoId, usuarioId],
  );
  if (!n.length) throw new HttpError(404, 'No encontramos esa tarjeta');
  const [r] = await pool.execute('INSERT INTO notas (nodo_id, usuario_id, texto) VALUES (?, ?, ?)', [nodoId, usuarioId, texto]);
  const [f] = await pool.execute(`SELECT ${CAMPOS} FROM notas WHERE id = ?`, [r.insertId]);
  return f[0];
}

async function editar(usuarioId, id, { texto }) {
  const [r] = await pool.execute('UPDATE notas SET texto = ? WHERE id = ? AND usuario_id = ?', [texto, id, usuarioId]);
  if (!r.affectedRows) throw new HttpError(404, 'No encontramos esa nota');
  const [f] = await pool.execute(`SELECT ${CAMPOS} FROM notas WHERE id = ?`, [id]);
  return f[0];
}

async function eliminar(usuarioId, id) {
  const [r] = await pool.execute('DELETE FROM notas WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
  if (!r.affectedRows) throw new HttpError(404, 'No encontramos esa nota');
}

module.exports = { listar, crear, editar, eliminar };
