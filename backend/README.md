# HIPERFOCKIE // BACKEND

`SYSTEM // 02 · Node 24.22.1 · Express 5.2.1 · MySQL 8.0 · API REST`

## 01 // Arranque

```bash
nvm use                      # lee .nvmrc (24.22.1)
npm ci                       # versiones exactas del package-lock
cp .env.example .env         # llena JWT_SECRETO, DB_PASSWORD, SMTP y PayPal
mysql -u root -p < sql/hiperfockie.sql
mysql -u root -p hiperfockie < sql/seed.sql
mysql -u root -p < sql/usuario_app.sql
npm run dev                  # http://localhost:3000/api  (--watch)
```

Sin `SMTP_HOST`, los correos se imprimen en la consola en lugar de enviarse.

## 02 // Estructura (MVC, SRS §8)

```
backend/
├─ server.js            arranque, limpieza diaria de caché
├─ app.js               Express, JSON, CORS, errores
├─ rutas.js             todas las rutas /api
├─ config/db.js         pool de mysql2 + transacciones
├─ middlewares/         verificarToken · limiteFocos · limitarIntentos · validar · errores
├─ controllers/         auth · busqueda · focos · notas · donaciones
├─ services/            lógica y consultas SQL parametrizadas
├─ adaptadores/         wikipedia · openalex · openlibrary  → formato tarjeta
├─ src/recomendacion.js puntaje, límites (código del ciclo TDD)
├─ src/relevancia.js    factores relevancia y confiabilidad
├─ sql/                 esquema, seed, usuario de la app, consultas
└─ test/                unitarias + integración
```

## 03 // Rutas

Todas responden `{ exito, mensaje, datos }`. 🔒 = requiere `Authorization: Bearer <token>`.

| Método | Ruta | Cuerpo / query | Respuestas |
|---|---|---|---|
| POST | `/api/auth/registro` | `nombre, correo, password, aceptoAviso: true` | 201 · 400 · 409 |
| POST | `/api/auth/login` | `correo, password` | 200 `{usuario, token}` · 401 (incluye bloqueo 15 min) |
| POST | `/api/auth/recuperar` | `correo` | 200 siempre (no revela correos) · 400 |
| POST | `/api/auth/restablecer` | `token, password` | 200 · 400 vencido o usado |
| GET 🔒 | `/api/auth/yo` | | 200 |
| GET 🔒 | `/api/busqueda?q=` | 3 a 200 caracteres | 200 `{tarjetas, avisos, desdeCache}` |
| GET 🔒 | `/api/focos` | | 200 |
| POST 🔒 | `/api/focos` | `tema`, `tarjeta?` (raíz; si falta, usa el mejor resultado) | 201 · 409 con 5 activos |
| PATCH 🔒 | `/api/focos/:id` | `estado: activo \| archivado` | 200 · 409 al reactivar con 5 |
| GET 🔒 | `/api/focos/:id/subtemas?nodo=` | sin `nodo` = último visitado | 200 máx. 5 por puntaje |
| POST 🔒 | `/api/focos/:id/nodos` | `padreId, tarjeta` | 201 `{nodo, accion}` · 400 nivel > 5 · 409 |
| GET 🔒 | `/api/focos/:id/arbol` | | 200 nodos para D3 |
| GET 🔒 | `/api/focos/:id/historial` | | 200 viñetas del cómic |
| GET 🔒 | `/api/notas?nodo=` | | 200 |
| POST 🔒 | `/api/notas` | `nodoId, texto` | 201 |
| PUT 🔒 | `/api/notas/:id` | `texto` | 200 · 404 |
| DELETE 🔒 | `/api/notas/:id` | | 200 · 404 |
| GET 🔒 | `/api/donaciones/token-cliente` | | 200 `{clientToken}` para el JS SDK v6 |
| POST 🔒 | `/api/donaciones/orden` | `monto` (> 0, máx. 10,000, 2 decimales) | 201 `{id}` · 400 |
| POST 🔒 | `/api/donaciones/:id/captura` | | 200 · 400 · 404 |

**Tarjeta** (RIS13): `titulo, resumen, fuente, url, licencia, anio, autores, portada, relevancia, confiabilidad, novedad, puntaje`.

## 04 // Pruebas

```bash
npm test         # 20 unitarias: PU-01 a PU-10, validaciones, adaptadores
npm run test:api # 29 de integración: PI-01 a PI-18, PS-01 a PS-04, PA-04
```

`test:api` necesita `hiperfockie_test` recién cargada (ver `test/api.test.js`) y un `.env.test` (copia `.env.test.example`). Las fuentes externas y PayPal se reemplazan por dobles de prueba, así que no gasta cuota de OpenAlex.

## 05 // Decisiones

- **PayPal:** el servidor llama directo a la API Orders v2 con token OAuth2 (RIS8) usando `fetch`, sin `@paypal/paypal-server-sdk`. Es una dependencia menos y lo que cobra PayPal se compara con el monto guardado al crear la orden.
- **Límite de 5 focos:** lo revisa el middleware (409, TDD) y otra vez dentro de la transacción con `SELECT … FOR UPDATE`, para que dos clics simultáneos no creen un sexto foco.
- **Login:** el mensaje es el mismo si el correo no existe o la contraseña falla. Tras 5 fallos se bloquea 15 min y el contador vuelve a 0.
- **CORS** solo acepta `FRONTEND_URL`. En producción Nginx sirve Angular y `/api` en el mismo dominio.

`END OF TRANSMISSION`
