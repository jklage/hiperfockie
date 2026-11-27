# HIPERFOCKIE // BASE DE DATOS

`SYSTEM // 01 · MySQL 8.0 · 8 tablas`

| # | Archivo | Qué hace |
|---|---|---|
| 01 | `hiperfockie.sql` | Crea la base `hiperfockie` desde cero: 8 tablas, PK, FK, UNIQUE, CHECK e índices |
| 02 | `seed.sql` | Datos de prueba para Postman (3 usuarios, 10 focos, madriguera de 4 niveles, notas, historial, caché, donaciones) |
| 03 | `usuario_app.sql` | Usuario `hiperfockie_app` sin permisos de administrador (solo SELECT/INSERT/UPDATE/DELETE) |
| 04 | `consultas.sql` | Las consultas parametrizadas que usará cada servicio de Express, agrupadas por ruta |

## Instalación

```bash
mysql -u root -p < backend/sql/hiperfockie.sql
mysql -u root -p hiperfockie < backend/sql/seed.sql
mysql -u root -p < backend/sql/usuario_app.sql   # antes cambia CAMBIA_ESTA_CLAVE
```

Base de pruebas (TDD):

```bash
sed -E 's/(DATABASE( IF EXISTS)?|USE) hiperfockie\b/\1 hiperfockie_test/' backend/sql/hiperfockie.sql | mysql -u root -p
sed 's/USE hiperfockie;/USE hiperfockie_test;/' backend/sql/seed.sql | mysql -u root -p
```

## Usuarios demo

Contraseña de todos: `Hiperfockie2026`

| Correo | Escenario |
|---|---|
| `yael@hiperfockie.test` | 4 focos activos + 1 archivado → crear uno más da 201 (PI-10) |
| `carlos@hiperfockie.test` | 5 focos activos → crear el sexto da 409 (PI-11, PA-03) |
| `nuevo@hiperfockie.test` | Sin focos; token de recuperación `token-demo-usado` ya usado → 400 (PI-16) |

## Reglas que protege la base

- `nodos.nivel` entre 1 y 5, `puntaje` entre 0 y 1, `fuente` solo `wikipedia`, `openalex` u `openlibrary`.
- Nodo raíz: `padre_id` NULL si y solo si `nivel = 1`.
- `historial (foco_id, orden)` único: una viñeta por posición.
- Borrar un usuario borra sus focos, nodos, notas, historial y tokens; sus donaciones se conservan con `usuario_id = NULL` (ARCO).
- El límite de 5 focos activos lo aplica el middleware `limiteFocos` (409), con el índice `(usuario_id, estado)`.

## Verificado

Probado en MySQL 8.0.46: esquema, seed, permisos del usuario de la app y las 30 pruebas de integración de `npm run test:api` (registro duplicado, bloqueo tras 5 intentos, token usado, caché, árbol, nivel 6, fuente fuera de lista blanca, notas y donaciones). 30 de 30 correctas.

Diagrama: `diagramas/DER_hiperfockie.excalidraw`

`END OF TRANSMISSION`
