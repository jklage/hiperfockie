
const API = () => process.env.PAYPAL_API ?? 'https://api-m.sandbox.paypal.com';
let token = { valor: null, vence: 0 };

async function obtenerToken() {
  if (token.valor && Date.now() < token.vence) return token.valor;
  const cred = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${API()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${cred}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`PayPal OAuth respondió ${r.status}`);
  const d = await r.json();
  token = { valor: d.access_token, vence: Date.now() + (d.expires_in - 60) * 1000 };
  return token.valor;
}

async function llamar(metodo, ruta, cuerpo) {
  const r = await fetch(`${API()}${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${await obtenerToken()}`, 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(`PayPal respondió ${r.status}: ${d.name ?? ''}`);
    e.paypal = d;
    throw e;
  }
  return d;
}

async function tokenCliente() {
  const cred = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const cuerpo = new URLSearchParams({ grant_type: 'client_credentials', response_type: 'client_token', intent: 'sdk_init' });
  // PayPal rechaza localhost como dominio; solo se envía con un dominio real
  const dominio = new URL(process.env.FRONTEND_URL ?? 'http://localhost:4200').hostname;
  if (dominio !== 'localhost') cuerpo.append('domains[]', dominio);
  const r = await fetch(`${API()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${cred}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: cuerpo,
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`PayPal client token respondió ${r.status}`);
  return (await r.json()).access_token;
}

const crearOrden = (monto) =>
  llamar('POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{
      description: 'Donación voluntaria a Hiperfockie',
      amount: { currency_code: process.env.PAYPAL_MONEDA ?? 'MXN', value: monto.toFixed(2) },
    }],
  });

const capturarOrden = (ordenId) => llamar('POST', `/v2/checkout/orders/${encodeURIComponent(ordenId)}/capture`);

module.exports = { crearOrden, capturarOrden, tokenCliente };
