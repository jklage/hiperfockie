

const { puedeCrearFoco } = require('../src/recomendacion');

module.exports = (contarFocosActivos) => async (req, res, next) => {

  if (req.method === 'PATCH' && req.body?.estado !== 'activo') return next();
  const activos = await contarFocosActivos(req.usuario.id);
  if (!puedeCrearFoco(activos)) {
    return res
      .status(409)
      .json({ exito: false, mensaje: 'Ya tienes 5 focos activos. Archiva uno para crear otro.', datos: { activos } });
  }
  next();
};
