
const { HttpError } = require('../utils/respuesta');
const { validarPregunta } = require('../src/recomendacion');

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FUENTES = ['wikipedia', 'openalex', 'openlibrary'];
const DOMINIOS = { wikipedia: /^https:\/\/es\.wikipedia\.org\//, openalex: /^https:\/\/(openalex\.org|doi\.org)\//, openlibrary: /^https:\/\/openlibrary\.org\// };

const texto = (v) => String(v ?? '').trim();
const fallar = (mensaje) => { throw new HttpError(400, mensaje); };

const registro = (req, _res, next) => {
  const nombre = texto(req.body?.nombre);
  const correo = texto(req.body?.correo).toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!nombre || !correo || !password) fallar('Nombre, correo y contraseña son obligatorios');
  if (nombre.length > 80) fallar('El nombre admite máximo 80 caracteres');
  if (correo.length > 120 || !CORREO.test(correo)) fallar('El correo no tiene un formato válido');
  if (password.length < 8) fallar('La contraseña debe tener al menos 8 caracteres');
  if (password.length > 72) fallar('La contraseña admite máximo 72 caracteres');
  if (req.body?.aceptoAviso !== true) fallar('Debes aceptar el aviso de privacidad');
  req.body = { nombre, correo, password };
  next();
};

const login = (req, _res, next) => {
  const correo = texto(req.body?.correo).toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!correo || !password) fallar('Escribe tu correo y tu contraseña');
  req.body = { correo, password };
  next();
};

const recuperar = (req, _res, next) => {
  const correo = texto(req.body?.correo).toLowerCase();
  if (!CORREO.test(correo)) fallar('El correo no tiene un formato válido');
  req.body = { correo };
  next();
};

const restablecer = (req, _res, next) => {
  const token = texto(req.body?.token);
  const password = String(req.body?.password ?? '');
  if (!/^[a-f0-9]{64}$/.test(token)) fallar('El enlace no es válido o ya expiró');
  if (password.length < 8 || password.length > 72) fallar('La contraseña debe tener entre 8 y 72 caracteres');
  req.body = { token, password };
  next();
};

const pregunta = (req, _res, next) => {
  const r = validarPregunta(req.query?.q);
  if (!r.ok) fallar(r.error);
  req.pregunta = r.texto;
  next();
};

const id = (nombre = 'id') => (req, _res, next) => {
  const n = Number(req.params[nombre]);
  if (!Number.isInteger(n) || n <= 0) fallar('Identificador no válido');
  req.params[nombre] = n;
  next();
};

function tarjeta(t, obligatoria = true) {
  if (t == null && !obligatoria) return null;
  if (typeof t !== 'object') fallar('Falta la tarjeta');
  const r = {
    titulo: texto(t.titulo).slice(0, 255),
    fuente: texto(t.fuente),
    url: texto(t.url),
    resumen: texto(t.resumen).slice(0, 5000) || null,
    licencia: texto(t.licencia).slice(0, 60),
    puntaje: Number(t.puntaje ?? 0),
  };
  if (!r.titulo) fallar('La tarjeta necesita título');
  if (!FUENTES.includes(r.fuente)) fallar('Fuente no permitida');
  if (r.url.length > 500 || !DOMINIOS[r.fuente].test(r.url)) fallar('El enlace no corresponde a la fuente');
  if (!r.licencia) fallar('La tarjeta necesita licencia');
  if (!Number.isFinite(r.puntaje) || r.puntaje < 0 || r.puntaje > 1) r.puntaje = 0;
  return r;
}

const crearFoco = (req, _res, next) => {
  const r = validarPregunta(req.body?.tema);
  if (!r.ok) fallar(r.error);
  req.body = { tema: r.texto, tarjeta: tarjeta(req.body?.tarjeta, false) };
  next();
};

const estadoFoco = (req, _res, next) => {
  if (!['activo', 'archivado'].includes(req.body?.estado)) fallar('El estado debe ser activo o archivado');
  next();
};

const nuevoNodo = (req, _res, next) => {
  const padreId = Number(req.body?.padreId);
  if (!Number.isInteger(padreId) || padreId <= 0) fallar('Falta el nodo padre');
  req.body = { padreId, tarjeta: tarjeta(req.body?.tarjeta) };
  next();
};

const nota = (req, _res, next) => {
  const t = texto(req.body?.texto);
  if (!t) fallar('La nota no puede estar vacía');
  if (t.length > 5000) fallar('La nota admite máximo 5000 caracteres');
  const nodoId = req.method === 'POST' ? Number(req.body?.nodoId) : null;
  if (req.method === 'POST' && (!Number.isInteger(nodoId) || nodoId <= 0)) fallar('Falta la tarjeta de la nota');
  req.body = { texto: t, nodoId };
  next();
};

const monto = (req, _res, next) => {
  const crudo = req.body?.monto;
  const m = typeof crudo === 'number' ? crudo : /^\d+(\.\d{1,2})?$/.test(String(crudo ?? '')) ? Number(crudo) : NaN;
  if (!Number.isFinite(m) || m <= 0) fallar('El monto debe ser un número mayor a cero');
  if (m > 10000) fallar('El monto máximo es de $10,000');
  if (Math.round(m * 100) !== m * 100) fallar('El monto admite máximo 2 decimales');
  req.body = { monto: m };
  next();
};

module.exports = { registro, login, recuperar, restablecer, pregunta, id, crearFoco, estadoFoco, nuevoNodo, nota, monto, tarjeta, FUENTES };
