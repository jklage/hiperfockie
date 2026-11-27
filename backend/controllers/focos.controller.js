const focos = require('../services/focos.service');
const { responder } = require('../utils/respuesta');

module.exports = {
  listar: async (req, res) => responder(res, 200, 'Tus focos', await focos.listar(req.usuario.id)),
  crear: async (req, res) => responder(res, 201, 'Foco creado', await focos.crear(req.usuario.id, req.body)),
  cambiarEstado: async (req, res) => {
    const f = await focos.cambiarEstado(req.params.id, req.usuario.id, req.body.estado);
    responder(res, 200, f.estado === 'activo' ? 'Foco reactivado' : 'Foco archivado', f);
  },
  subtemas: async (req, res) => {
    const nodo = req.query.nodo ? Number(req.query.nodo) : null;
    responder(res, 200, 'Subtemas ordenados por puntaje', await focos.subtemas(req.params.id, req.usuario.id, Number.isInteger(nodo) && nodo > 0 ? nodo : null));
  },
  avanzar: async (req, res) => responder(res, 201, 'Avanzaste a un nuevo tema', await focos.avanzar(req.params.id, req.usuario.id, req.body)),
  arbol: async (req, res) => responder(res, 200, 'Madriguera del foco', await focos.arbol(req.params.id, req.usuario.id)),
  historial: async (req, res) => responder(res, 200, 'Historial del foco', await focos.historial(req.params.id, req.usuario.id)),
};
