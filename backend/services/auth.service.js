
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, transaccion } = require('../config/db');
const { HttpError } = require('../utils/respuesta');
const correo = require('./correo.service');

const COSTO = 12;
const MAX_INTENTOS = 5;
let hashFalso;
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const firmar = (u) =>
  jwt.sign({ id: u.id, nombre: u.nombre, correo: u.correo }, process.env.JWT_SECRETO, {
    expiresIn: process.env.JWT_EXPIRA ?? '2h',
  });

async function registrar({ nombre, correo: email, password }) {
  const hash = await bcrypt.hash(password, COSTO);
  let id;
  try {
    const [r] = await pool.execute(
      'INSERT INTO usuarios (nombre, correo, password_hash, acepto_aviso_en) VALUES (?, ?, ?, NOW())',
      [nombre, email, hash],
    );
    id = r.insertId;
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'El correo ya está registrado');
    throw e;
  }
  const usuario = { id, nombre, correo: email };
  correo.bienvenida(usuario);
  return { usuario, token: firmar(usuario) };
}

async function iniciarSesion({ correo: email, password }) {
  const [f] = await pool.execute(
    'SELECT id, nombre, correo, password_hash FROM usuarios WHERE correo = ?',
    [email],
  );
  const u = f[0];

  hashFalso ??= await bcrypt.hash('hiperfockie-sin-cuenta', COSTO);
  const ok = await bcrypt.compare(password, u?.password_hash ?? hashFalso);
  if (!u || !ok) {
    if (u) {
      await pool.execute(

        `UPDATE usuarios
         SET intentos_fallidos = intentos_fallidos + 1,
             bloqueado_hasta = IF(intentos_fallidos >= ?, NOW() + INTERVAL 15 MINUTE, bloqueado_hasta),
             intentos_fallidos = IF(intentos_fallidos >= ?, 0, intentos_fallidos)
         WHERE id = ?`,
        [MAX_INTENTOS, MAX_INTENTOS, u.id],
      );
    }
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }
  await pool.execute('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?', [u.id]);
  const usuario = { id: u.id, nombre: u.nombre, correo: u.correo };
  return { usuario, token: firmar(usuario) };
}

async function solicitarRecuperacion({ correo: email }) {
  const [f] = await pool.execute('SELECT id, nombre, correo FROM usuarios WHERE correo = ?', [email]);
  if (!f.length) return;
  const token = crypto.randomBytes(32).toString('hex');
  await pool.execute(
    'INSERT INTO tokens_recuperacion (usuario_id, token_hash, expira_en) VALUES (?, ?, NOW() + INTERVAL 30 MINUTE)',
    [f[0].id, sha256(token)],
  );
  await correo.recuperacion(f[0], token);
}

async function restablecer({ token, password }) {
  const hash = await bcrypt.hash(password, COSTO);
  await transaccion(async (con) => {
    const [f] = await con.execute(
      'SELECT id, usuario_id FROM tokens_recuperacion WHERE token_hash = ? AND usado = FALSE AND expira_en > NOW() FOR UPDATE',
      [sha256(token)],
    );
    if (!f.length) throw new HttpError(400, 'El enlace no es válido o ya expiró');
    await con.execute(
      'UPDATE usuarios SET password_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
      [hash, f[0].usuario_id],
    );
    await con.execute('UPDATE tokens_recuperacion SET usado = TRUE WHERE id = ?', [f[0].id]);
  });
}

module.exports = { registrar, iniciarSesion, solicitarRecuperacion, restablecer, sha256 };
