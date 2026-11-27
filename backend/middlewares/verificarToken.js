
const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/respuesta');

module.exports = (req, _res, next) => {
  const [tipo, token] = (req.get('authorization') ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) throw new HttpError(401, 'Inicia sesión para continuar');
  try {
    const p = jwt.verify(token, process.env.JWT_SECRETO);
    req.usuario = { id: p.id, nombre: p.nombre, correo: p.correo };
    next();
  } catch {
    throw new HttpError(401, 'Tu sesión expiró. Inicia sesión de nuevo');
  }
};
