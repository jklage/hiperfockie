
const crypto = require('node:crypto');
const { pool } = require('../config/db');

const normalizar = (q) => String(q).trim().toLowerCase().replace(/\s+/g, ' ');
const clave = (fuente, q) => crypto.createHash('sha256').update(`${fuente}|${normalizar(q)}`).digest('hex');

async function leer(fuente, q) {
  const [f] = await pool.execute(
    'SELECT respuesta_json FROM cache_api WHERE clave_hash = ? AND expira_en > NOW()',
    [clave(fuente, q)],
  );
  return f.length ? f[0].respuesta_json : null;
}

async function guardar(fuente, q, tarjetas) {
  await pool.execute(
    `INSERT INTO cache_api (clave_hash, fuente, respuesta_json, expira_en)
     VALUES (?, ?, ?, NOW() + INTERVAL 7 DAY) AS nuevo
     ON DUPLICATE KEY UPDATE respuesta_json = nuevo.respuesta_json, expira_en = nuevo.expira_en`,
    [clave(fuente, q), fuente, JSON.stringify(tarjetas)],
  );
}

async function limpiarVencidos() {
  const [r] = await pool.execute('DELETE FROM cache_api WHERE expira_en <= NOW()');
  return r.affectedRows;
}

module.exports = { leer, guardar, limpiarVencidos, clave, normalizar };
