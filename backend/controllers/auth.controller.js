const auth = require('../services/auth.service');
const { responder } = require('../utils/respuesta');

module.exports = {
  registro: async (req, res) => responder(res, 201, 'Cuenta creada. Te enviamos un correo de bienvenida.', await auth.registrar(req.body)),
  login: async (req, res) => responder(res, 200, 'Sesión iniciada', await auth.iniciarSesion(req.body)),
  recuperar: async (req, res) => {
    await auth.solicitarRecuperacion(req.body);
    responder(res, 200, 'Si el correo está registrado, te enviamos un enlace para crear una nueva contraseña.');
  },
  restablecer: async (req, res) => {
    await auth.restablecer(req.body);
    responder(res, 200, 'Contraseña actualizada. Ya puedes iniciar sesión.');
  },
  yo: (req, res) => responder(res, 200, 'Sesión válida', { usuario: req.usuario }),
};
