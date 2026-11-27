
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PUERTO ?? 3306),
  user: process.env.DB_USUARIO,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NOMBRE ?? 'hiperfockie',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: 'Z',
  dateStrings: false,
});

async function transaccion(fn) {
  const con = await pool.getConnection();
  try {
    await con.beginTransaction();
    const r = await fn(con);
    await con.commit();
    return r;
  } catch (e) {
    await con.rollback();
    throw e;
  } finally {
    con.release();
  }
}

async function verificarConexion() {
  try {
    const [[fila]] = await pool.query('SELECT NOW() AS fecha, VERSION() AS version');
    console.log(`Conexion exitosa a MySQL ${fila.version}`);
  } catch (e) {
    console.error(`Error de conexion a MySQL (${e.code ?? e.message}).`);
    console.error('Revisa que el servidor este encendido y los datos DB_* de backend/.env.');
    process.exit(1);
  }
}

module.exports = { pool, transaccion, verificarConexion };
