

INSERT INTO usuarios (nombre, correo, password_hash, acepto_aviso_en)
VALUES (?, ?, ?, NOW());

SELECT id, nombre, correo, password_hash, intentos_fallidos, bloqueado_hasta
FROM usuarios WHERE correo = ?;

UPDATE usuarios
SET intentos_fallidos = intentos_fallidos + 1,
    bloqueado_hasta   = IF(intentos_fallidos >= 5, NOW() + INTERVAL 15 MINUTE, bloqueado_hasta),
    intentos_fallidos = IF(intentos_fallidos >= 5, 0, intentos_fallidos)
WHERE id = ?;

UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?;

INSERT INTO tokens_recuperacion (usuario_id, token_hash, expira_en)
VALUES (?, ?, NOW() + INTERVAL 30 MINUTE);

SELECT id, usuario_id FROM tokens_recuperacion
WHERE token_hash = ? AND usado = FALSE AND expira_en > NOW();

UPDATE usuarios SET password_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?;
UPDATE tokens_recuperacion SET usado = TRUE WHERE id = ?;

SELECT respuesta_json FROM cache_api WHERE clave_hash = ? AND expira_en > NOW();

INSERT INTO cache_api (clave_hash, fuente, respuesta_json, expira_en)
VALUES (?, ?, ?, NOW() + INTERVAL 7 DAY) AS nuevo
ON DUPLICATE KEY UPDATE respuesta_json = nuevo.respuesta_json,
                        expira_en      = nuevo.expira_en;

DELETE FROM cache_api WHERE expira_en <= NOW();

SELECT COUNT(*) AS activos FROM focos WHERE usuario_id = ? AND estado = 'activo';

SELECT f.id, f.tema_raiz, f.estado, f.creado_en,
       (SELECT COUNT(*) FROM nodos n WHERE n.foco_id = f.id AND n.visitado_en IS NOT NULL) AS temas_visitados
FROM focos f
WHERE f.usuario_id = ?
ORDER BY f.estado = 'activo' DESC, f.creado_en DESC;

INSERT INTO focos (usuario_id, tema_raiz) VALUES (?, ?);
INSERT INTO nodos (foco_id, padre_id, titulo, fuente, url, extracto, licencia, puntaje, nivel, visitado_en)
VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 1, NOW());
INSERT INTO historial (foco_id, nodo_id, orden, accion) VALUES (?, ?, 1, 'crear_foco');

UPDATE focos SET estado = ? WHERE id = ? AND usuario_id = ?;

SELECT n.id, n.padre_id, n.titulo, n.fuente, n.url, n.licencia, n.puntaje, n.nivel, n.visitado_en
FROM nodos n JOIN focos f ON f.id = n.foco_id
WHERE n.foco_id = ? AND f.usuario_id = ?
ORDER BY n.nivel, n.puntaje DESC;

SELECT url FROM nodos WHERE foco_id = ? AND visitado_en IS NOT NULL;

SELECT nivel FROM nodos WHERE id = ? AND foco_id = ?;
INSERT INTO nodos (foco_id, padre_id, titulo, fuente, url, extracto, licencia, puntaje, nivel, visitado_en)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());

INSERT INTO historial (foco_id, nodo_id, orden, accion)
SELECT ?, ?, COALESCE(MAX(orden), 0) + 1, 'visitar' FROM historial WHERE foco_id = ?;

SELECT h.orden, h.accion, h.creado_en, n.id AS nodo_id, n.titulo, n.fuente, n.url, n.nivel
FROM historial h
JOIN nodos n ON n.id = h.nodo_id
JOIN focos f ON f.id = h.foco_id
WHERE h.foco_id = ? AND f.usuario_id = ?
ORDER BY h.orden;

INSERT INTO notas (nodo_id, usuario_id, texto) VALUES (?, ?, ?);
UPDATE notas SET texto = ? WHERE id = ? AND usuario_id = ?;
DELETE FROM notas WHERE id = ? AND usuario_id = ?;
SELECT id, nodo_id, texto, creado_en, actualizado_en FROM notas WHERE nodo_id = ? AND usuario_id = ? ORDER BY creado_en;

INSERT INTO donaciones (usuario_id, paypal_order_id, monto, estado) VALUES (?, ?, ?, 'CREATED');
UPDATE donaciones SET estado = ? WHERE paypal_order_id = ? AND usuario_id = ?;
