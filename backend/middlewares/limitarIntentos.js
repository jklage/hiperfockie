
const { pool } = require('../config/db');
const { HttpError } = require('../utils/respuesta');

async function loginBloqueado(req, _res, next) {
  const correo = String(req.body?.correo ?? '').trim().toLowerCase();
  if (!correo) return next();
  const [filas] = await pool.execute(
    'SELECT TIMESTAMPDIFF(SECOND, NOW(), bloqueado_hasta) AS seg FROM usuarios WHERE correo = ? AND bloqueado_hasta > NOW()',
    [correo],
  );
  if (filas.length) {
    const min = Math.ceil(filas[0].seg / 60);
    throw new HttpError(401, `Demasiados intentos. Intenta de nuevo en ${min} min.`);
  }
  next();
}

const VENTANA_MS = 15 * 60 * 1000;
const registros = new Map();
function frenoRecuperacion(req, _res, next) {
  const ahora = Date.now();
  const lista = (registros.get(req.ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (lista.length >= 3) throw new HttpError(400, 'Ya pediste varios enlaces. Espera 15 minutos.');
  lista.push(ahora);
  registros.set(req.ip, lista);
  next();
}

module.exports = { loginBloqueado, frenoRecuperacion, _registros: registros };
