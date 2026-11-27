
const { HttpError } = require('../utils/respuesta');

function noEncontrado(req, _res, next) {
  next(new HttpError(404, `No existe la ruta ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function manejarErrores(err, _req, res, _next) {
  let status = err.status ?? 500;
  let mensaje = err.message;
  if (err.type === 'entity.parse.failed') { status = 400; mensaje = 'El cuerpo de la petición no es JSON válido'; }
  else if (err.code === 'ER_DUP_ENTRY') { status = 409; mensaje = 'El registro ya existe'; }
  else if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') { status = 400; mensaje = 'Los datos no cumplen las reglas del sistema'; }
  else if (!(err instanceof HttpError) && status === 500) {
    console.error('[ERROR]', err);
    mensaje = 'Ocurrió un error en el servidor. Intenta más tarde.';
  }
  res.status(status).json({ exito: false, mensaje, datos: err.datos ?? null });
}

module.exports = { noEncontrado, manejarErrores };
