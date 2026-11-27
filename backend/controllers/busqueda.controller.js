const busqueda = require('../services/busqueda.service');
const { responder } = require('../utils/respuesta');

module.exports = {
  buscar: async (req, res) => {
    const r = await busqueda.buscar(req.pregunta);
    r.tarjetas.sort((a, b) => b.puntaje - a.puntaje);
    const mensaje = r.tarjetas.length ? `${r.tarjetas.length} resultados` : 'No encontramos resultados para esa pregunta';
    responder(res, 200, mensaje, { pregunta: req.pregunta, ...r });
  },
};
