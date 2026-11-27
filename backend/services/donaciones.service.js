
const { pool } = require('../config/db');
const { HttpError } = require('../utils/respuesta');
const paypal = require('./paypal.service');
const correo = require('./correo.service');

async function crearOrden(usuario, monto) {
  let orden;
  try {
    orden = await paypal.crearOrden(monto);
  } catch (e) {
    console.error('[PAYPAL]', e.message);
    throw new HttpError(500, 'No pudimos conectar con PayPal. Intenta más tarde.');
  }
  await pool.execute(
    "INSERT INTO donaciones (usuario_id, paypal_order_id, monto, estado) VALUES (?, ?, ?, 'CREATED')",
    [usuario.id, orden.id, monto],
  );
  return { id: orden.id, monto };
}

async function capturar(usuario, ordenId) {
  const [f] = await pool.execute(
    'SELECT id, monto, estado FROM donaciones WHERE paypal_order_id = ? AND usuario_id = ?',
    [ordenId, usuario.id],
  );
  if (!f.length) throw new HttpError(404, 'No encontramos esa donación');
  const d = f[0];
  if (d.estado === 'COMPLETED') return { id: ordenId, estado: 'COMPLETED', monto: Number(d.monto) };

  let r;
  try {
    r = await paypal.capturarOrden(ordenId);
  } catch (e) {
    console.error('[PAYPAL]', e.message);
    await pool.execute("UPDATE donaciones SET estado = 'FAILED' WHERE id = ?", [d.id]);
    throw new HttpError(400, 'PayPal no pudo completar el pago');
  }

  const cobro = r.purchase_units?.[0]?.payments?.captures?.[0];
  const estado = r.status === 'COMPLETED' && cobro?.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
  if (estado === 'COMPLETED' && Number(cobro.amount?.value) !== Number(d.monto)) {
    await pool.execute("UPDATE donaciones SET estado = 'FAILED' WHERE id = ?", [d.id]);
    throw new HttpError(400, 'El monto cobrado no coincide con la orden');
  }
  await pool.execute('UPDATE donaciones SET estado = ? WHERE id = ?', [estado, d.id]);
  if (estado !== 'COMPLETED') throw new HttpError(400, 'El pago no se completó');
  correo.agradecimiento(usuario, d.monto);
  return { id: ordenId, estado, monto: Number(d.monto) };
}

module.exports = { crearOrden, capturar };
