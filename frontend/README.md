# HIPERFOCKIE // FRONTEND

`SYSTEM // 03 · Angular 22.2.0 · TypeScript 6.0 · D3 7.9.0 · SPA responsiva`

## 01 // Arranque

```bash
nvm use            # 24.22.1
npm ci             # versiones exactas
npm start          # http://localhost:4200  (proxy /api → http://localhost:3000)
npm run build      # dist/frontend/browser → Nginx en producción
```

Necesita el backend corriendo en el puerto 3000 (`cd ../backend && npm run dev`).

## 02 // Pantallas (mapa de navegación del SRS)

| Ruta | Acceso | Qué hace |
|---|---|---|
| `/` | Visitante | Inicio con la madriguera de ejemplo |
| `/registro` | Visitante | Cuenta con aviso de privacidad obligatorio |
| `/login` | Visitante | JWT de 2 h, muestra bloqueo tras 5 intentos |
| `/recuperar`, `/restablecer?token=` | Todos | Enlace de 30 min, un solo uso |
| `/aviso-privacidad` | Todos | LFPDPPP y derechos ARCO |
| `/explorar?q=` | Usuario | Búsqueda en 3 fuentes, tarjetas, subtemas sugeridos y "Convertir en foco" (modal 409 si ya hay 5) |
| `/focos` | Usuario | 5 espacios, archivar y reactivar |
| `/focos/:id/madriguera` | Usuario | Árbol D3 por niveles N1-N5, subtemas punteados, notas |
| `/focos/:id/historial`, `/historial` | Usuario | Cómic vertical, una viñeta por tema |
| `/donar` | Usuario | $50, $100, $200 u otro monto, PayPal JS SDK v6 sandbox |
| `/sin-acceso`, `**` | Todos | 401 y 404 |

En pantallas menores a 768 px la barra se vuelve menú inferior y las tarjetas van en una columna (RIU20).

## 03 // Estructura

```
src/app/
├─ core/          api.service · sesion.service · interceptor (Bearer) · guardias · modelos · avisos
├─ componentes/   navbar · pie · logo · tarjeta · limite (modal 409) · toasts
└─ paginas/       inicio · login · registro · recuperar · restablecer · aviso
                  explorar · focos · madriguera · historial · donar · no-encontrada
```

Todo el estado de las pantallas usa señales (Angular 22 sin zone.js). La identidad visual es la del maquetado (SRS §11): naranja `#E4572E`, tinta `#1D1B16`, papel `#FAF8F4`, Lilita One, Nunito, Cascadia Code y Comic Neue como respaldo de Comic Shanns.

## 04 // PayPal

`/donar` carga `https://www.sandbox.paypal.com/web-sdk/v6/core`, pide un *client token* a `GET /api/donaciones/token-cliente` y abre la sesión de pago con `createPayPalOneTimePaymentSession`. El monto lo valida y lo fija el backend.

`END OF TRANSMISSION`
