
const nodemailer = require('nodemailer');

let transporte;
function obtenerTransporte() {
  if (transporte) return transporte;
  transporte = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PUERTO ?? 587),
        secure: false,
        requireTLS: true,
        auth: { user: process.env.SMTP_USUARIO, pass: process.env.SMTP_PASSWORD },
      })
    : nodemailer.createTransport({ jsonTransport: true });
  return transporte;
}

const plantilla = (titulo, cuerpo) => `
<div style="background:#FAF8F4;padding:32px;font-family:Nunito,Arial,sans-serif;color:#1D1B16">
  <div style="max-width:520px;margin:auto;background:#fff;border:2px solid #1D1B16;border-radius:12px;padding:28px">
    <p style="margin:0;font-family:'Cascadia Code',monospace;font-size:12px;color:#E4572E">HIPERFOCKIE</p>
    <h1 style="font-size:24px;margin:8px 0 16px">${titulo}</h1>
    ${cuerpo}
    <p style="font-size:12px;color:#6b675f;margin-top:24px">Este correo se envió automáticamente. No respondas a este mensaje.</p>
  </div>
</div>`;

const boton = (href, texto) =>
  `<a href="${href}" style="display:inline-block;background:#E4572E;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">${texto}</a>`;

async function enviar(para, asunto, html) {
  const info = await obtenerTransporte().sendMail({
    from: process.env.SMTP_REMITENTE ?? 'Hiperfockie <no-responder@localhost>',
    to: para,
    subject: asunto,
    html,
  });
  if (!process.env.SMTP_HOST) console.log(`[CORREO] (sin SMTP) para ${para}: ${asunto}`);
  return info;
}

const seguro = (p) => p.catch((e) => console.error('[CORREO] no se pudo enviar:', e.message));

const bienvenida = (u) => seguro(enviar(u.correo, 'Bienvenido a Hiperfockie',
  plantilla(`¡Hola, ${escapar(u.nombre)}!`,
    `<p>Tu cuenta quedó lista. Escribe una pregunta y sigue la madriguera con fuentes confiables.</p>
     ${boton(`${process.env.FRONTEND_URL}/explorar`, 'Empezar a explorar')}`)));

const recuperacion = (u, token) => seguro(enviar(u.correo, 'Crea una nueva contraseña',
  plantilla('Recupera tu cuenta',
    `<p>Recibimos una solicitud para cambiar tu contraseña. El enlace vence en <b>30 minutos</b> y sirve una sola vez.</p>
     ${boton(`${process.env.FRONTEND_URL}/restablecer?token=${token}`, 'Crear nueva contraseña')}
     <p style="font-size:13px">Si no fuiste tú, ignora este correo.</p>`)));

const agradecimiento = (u, monto) => seguro(enviar(u.correo, 'Gracias por tu donación',
  plantilla(`Gracias, ${escapar(u.nombre)}`,
    `<p>Recibimos tu donación de <b>$${Number(monto).toFixed(2)} ${process.env.PAYPAL_MONEDA ?? 'MXN'}</b>. Ayudas a que Hiperfockie siga siendo gratuito.</p>`)));

function escapar(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

module.exports = { bienvenida, recuperacion, agradecimiento };
