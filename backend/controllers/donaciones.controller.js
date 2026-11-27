const donaciones = require('../services/donaciones.service');
const { responder, HttpError } = require('../utils/respuesta');

const paypal = require('../services/paypal.service');

module.exports = {
  tokenCliente: async (_req, res) => {
    let clientToken;
    try { clientToken = await paypal.tokenCliente(); } catch (e) {
      console.error('[PAYPAL]', e.message);
      throw new HttpError(500, 'No pudimos conectar con PayPal. Intenta más tarde.');
    }
    responder(res, 200, 'Token de PayPal', { clientToken });
  },
  crearOrden: async (req, res) => responder(res, 201, 'Orden creada', await donaciones.crearOrden(req.usuario, req.body.monto)),
  capturar: async (req, res) => {
    const id = String(req.params.id);
    if (!/^[A-Z0-9]{5,40}$/.test(id)) throw new HttpError(400, 'Orden no válida');
    responder(res, 200, '¡Gracias por tu donación! Te enviamos un correo de confirmación.', await donaciones.capturar(req.usuario, id));
  },
};
