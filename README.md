# Hiperfockie

Web para explorar un tema por "madrigueras": cada búsqueda junta tarjetas de Wikipedia, OpenAlex y Open Library, y cada tarjeta abre subtemas hasta 5 niveles. Frontend en Angular 22, backend en Node.js con Express 5 y base de datos MySQL 8.0.

## Módulos

| Módulo | Qué hace |
| --- | --- |
| Acceso | Registro con aviso de privacidad, inicio de sesión con JWT (2 h), bloqueo tras 5 intentos y recuperación de contraseña por correo |
| Explorar | Búsqueda en las tres fuentes con puntaje de relevancia y caché |
| Focos y madriguera | Hasta 5 focos activos, árbol de subtemas con D3 y archivado |
| Notas | Notas por tarjeta: crear, editar y borrar |
| Historial | Recorrido de cada foco en forma de viñetas |
| Donaciones | Donativo con PayPal (sandbox) |

## Requisitos

- Node.js 22.12 o más nuevo (probado con 24)
- MySQL 8.0
- VS Code con las extensiones recomendadas (las ofrece al abrir la carpeta)

## Instalación

1. Instala las dependencias de backend y frontend desde la raíz:

   ```bash
   npm run instalar
   ```

2. Crea la base de datos, los datos de prueba y el usuario de la app:

   ```bash
   mysql -u root -p < backend/sql/hiperfockie.sql
   mysql -u root -p hiperfockie < backend/sql/seed.sql
   mysql -u root -p < backend/sql/usuario_app.sql
   ```

3. Copia `backend/.env.example` como `backend/.env` y llena tus datos (`JWT_SECRETO`, `DB_PASSWORD`, PayPal y SMTP).

## Cómo correrlo

En VS Code: `F5` con la configuración **Hiperfockie completo** (levanta la API y abre el navegador), o `Terminal > Ejecutar tarea > Hiperfockie: todo`.

Desde la terminal, en dos ventanas:

```bash
npm run backend     # API en http://localhost:3000/api
npm run frontend    # http://localhost:4200
```

`frontend/proxy.conf.json` manda las peticiones `/api` al backend.

Usuario demo: `yael@hiperfockie.test` / `Hiperfockie2026`

## Pruebas

```bash
npm test            # unitarias (recomendación, middlewares, adaptadores)
npm run test:api    # integración contra hiperfockie_test (ver backend/README.md)
```

`backend/api.http` tiene peticiones listas para probar a mano con la extensión REST Client.

## Servicios externos

- **PayPal:** modo sandbox con `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`.
- **Correo:** Nodemailer por SMTP. Si `SMTP_HOST` está vacío, los correos se imprimen en la consola.

## Estructura

El backend sigue el modelo MVC. Cada petición sigue el mismo camino: `rutas.js` valida la entrada y revisa la sesión, el controlador llama a su servicio y `responder()` regresa `{ exito, mensaje, datos }`.

```
backend/
  server.js        revisa .env y la conexión, y arranca Express
  app.js           JSON, CORS y manejo de errores
  rutas.js         todas las rutas de la API, agrupadas por módulo
  config/db.js     pool de MySQL, transacciones y verificarConexion
  middlewares/     verificarToken, validar, limiteFocos, limitarIntentos, errores
  controllers/     un controlador por módulo
  services/        reglas y consultas SQL de cada módulo
  adaptadores/     Wikipedia, OpenAlex y Open Library al formato tarjeta
  src/             puntaje y límites (código del ciclo TDD)
  sql/             esquema, datos de prueba y usuario de la app
  test/            pruebas unitarias y de integración
frontend/src/app/
  core/            api.service (única puerta al backend), sesión, guardias, interceptor
  componentes/     navbar, tarjeta, logo, avisos
  paginas/         una pantalla por sección
diagramas/         DER en Excalidraw (se abre en VS Code con la extensión Excalidraw)
capturas/          pantallas probadas a 1280 px y 360 px
docs/              TRAZABILIDAD.md: requerimiento, archivo y prueba
```
