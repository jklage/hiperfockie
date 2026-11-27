
const { Router } = require('express');
const verificarToken = require('./middlewares/verificarToken');
const limiteFocos = require('./middlewares/limiteFocos');
const { loginBloqueado, frenoRecuperacion } = require('./middlewares/limitarIntentos');
const v = require('./middlewares/validar');
const { contarFocosActivos } = require('./services/focos.service');

const auth = require('./controllers/auth.controller');
const busqueda = require('./controllers/busqueda.controller');
const focos = require('./controllers/focos.controller');
const notas = require('./controllers/notas.controller');
const donaciones = require('./controllers/donaciones.controller');

const r = Router();
const limite = limiteFocos(contarFocosActivos);

r.post('/auth/registro', v.registro, auth.registro);
r.post('/auth/login', v.login, loginBloqueado, auth.login);
r.post('/auth/recuperar', v.recuperar, frenoRecuperacion, auth.recuperar);
r.post('/auth/restablecer', v.restablecer, auth.restablecer);

const sesion = verificarToken;
r.get('/auth/yo', sesion, auth.yo);

r.get('/busqueda', sesion, v.pregunta, busqueda.buscar);

r.get('/focos', sesion, focos.listar);
r.post('/focos', sesion, limite, v.crearFoco, focos.crear);
r.patch('/focos/:id', sesion, v.id(), v.estadoFoco, limite, focos.cambiarEstado);
r.get('/focos/:id/subtemas', sesion, v.id(), focos.subtemas);
r.post('/focos/:id/nodos', sesion, v.id(), v.nuevoNodo, focos.avanzar);
r.get('/focos/:id/arbol', sesion, v.id(), focos.arbol);
r.get('/focos/:id/historial', sesion, v.id(), focos.historial);

r.get('/notas', sesion, notas.listar);
r.post('/notas', sesion, v.nota, notas.crear);
r.put('/notas/:id', sesion, v.id(), v.nota, notas.editar);
r.delete('/notas/:id', sesion, v.id(), notas.eliminar);

r.get('/donaciones/token-cliente', sesion, donaciones.tokenCliente);
r.post('/donaciones/orden', sesion, v.monto, donaciones.crearOrden);
r.post('/donaciones/:id/captura', sesion, donaciones.capturar);

module.exports = r;
