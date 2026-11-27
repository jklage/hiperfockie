
const express = require('express');
const rutas = require('./rutas');
const { noEncontrado, manejarErrores } = require('./middlewares/errores');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  const origen = process.env.FRONTEND_URL;
  if (origen && req.get('origin') === origen) {
    res.set({
      'Access-Control-Allow-Origin': origen,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE',
      Vary: 'Origin',
    });
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});

app.get('/api/salud', (_req, res) => res.json({ exito: true, mensaje: 'SYSTEM ONLINE', datos: null }));
app.use('/api', rutas);
app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
