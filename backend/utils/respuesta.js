

class HttpError extends Error {
  constructor(status, mensaje, datos = null) {
    super(mensaje);
    this.status = status;
    this.datos = datos;
  }
}

const responder = (res, status, mensaje, datos = null) =>
  res.status(status).json({ exito: status < 400, mensaje, datos });

module.exports = { HttpError, responder };
