const notas = require('../services/notas.service');
const { responder } = require('../utils/respuesta');
const { HttpError } = require('../utils/respuesta');

module.exports = {
  listar: async (req, res) => {
    const nodoId = Number(req.query.nodo);
    if (!Number.isInteger(nodoId) || nodoId <= 0) throw new HttpError(400, 'Indica la tarjeta con ?nodo=');
    responder(res, 200, 'Notas de la tarjeta', await notas.listar(req.usuario.id, nodoId));
  },
  crear: async (req, res) => responder(res, 201, 'Nota guardada', await notas.crear(req.usuario.id, req.body)),
  editar: async (req, res) => responder(res, 200, 'Nota actualizada', await notas.editar(req.usuario.id, req.params.id, req.body)),
  eliminar: async (req, res) => {
    await notas.eliminar(req.usuario.id, req.params.id);
    responder(res, 200, 'Nota eliminada');
  },
};
