
const app = require('./app');
const { verificarConexion } = require('./config/db');
const cache = require('./services/cache.service');

for (const v of ['JWT_SECRETO', 'DB_USUARIO']) {
  if (!process.env[v]) {
    console.error(`Falta la variable ${v} en .env (copia .env.example)`);
    process.exit(1);
  }
}

const PUERTO = Number(process.env.PUERTO ?? 3000);

(async () => {
  await verificarConexion();
  const borradas = await cache.limpiarVencidos();
  setInterval(() => cache.limpiarVencidos().catch(() => {}), 24 * 60 * 60 * 1000).unref();
  app.listen(PUERTO, () => console.log(`Hiperfockie API en http://localhost:${PUERTO}/api  ·  caché vencida borrada: ${borradas}`));
})().catch((e) => {
  console.error('No se pudo iniciar:', e.message);
  process.exit(1);
});
