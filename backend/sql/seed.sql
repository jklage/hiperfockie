
USE hiperfockie;

SET @hash := '$2a$12$uW560EGLJvVOYFmt9GWK.OcXJpEy/6Ac97UzI/1oJgJ2uaWw7.yQ2';

INSERT INTO usuarios (id, nombre, correo, password_hash, acepto_aviso_en, creado_en) VALUES
  (1, 'Yael Pérez',     'yael@hiperfockie.test',   @hash, '2026-11-10 09:00:00', '2026-11-10 09:00:00'),
  (2, 'Carlos Barbosa', 'carlos@hiperfockie.test', @hash, '2026-11-10 09:05:00', '2026-11-10 09:05:00'),
  (3, 'Usuario Nuevo',  'nuevo@hiperfockie.test',  @hash, '2026-11-24 18:30:00', '2026-11-24 18:30:00');

INSERT INTO tokens_recuperacion (usuario_id, token_hash, expira_en, usado) VALUES
  (3, SHA2('token-demo-usado', 256), '2026-11-24 19:00:00', TRUE);

INSERT INTO focos (id, usuario_id, tema_raiz, estado, creado_en) VALUES
  (1, 1, '¿Qué pasa con el tiempo cerca de un agujero negro?', 'activo',    '2026-11-20 10:00:00'),
  (2, 1, 'Origen de la imprenta',                              'activo',    '2026-11-21 11:00:00'),
  (3, 1, 'Cómo funciona la fotosíntesis',                      'activo',    '2026-11-22 12:00:00'),
  (4, 1, 'Historia del ajedrez',                               'activo',    '2026-11-23 13:00:00'),
  (5, 1, 'Mitología nórdica',                                  'archivado', '2026-11-15 16:00:00'),
  (6, 2, 'Algoritmos de grafos BFS y DFS',                     'activo',    '2026-11-18 09:00:00'),
  (7, 2, 'Revolución mexicana',                                'activo',    '2026-11-19 09:00:00'),
  (8, 2, 'Inteligencia de los pulpos',                         'activo',    '2026-11-20 09:00:00'),
  (9, 2, 'Arquitectura brutalista',                            'activo',    '2026-11-21 09:00:00'),
  (10, 2, 'Cambio climático y océanos',                        'activo',    '2026-11-22 09:00:00');

INSERT INTO nodos (id, foco_id, padre_id, titulo, fuente, url, extracto, licencia, puntaje, nivel, visitado_en) VALUES
  (1, 1, NULL, 'Agujero negro', 'wikipedia',
      'https://es.wikipedia.org/wiki/Agujero_negro',
      'Un agujero negro es una región finita del espacio en cuyo interior existe una concentración de masa lo suficientemente elevada como para generar un campo gravitatorio tal que ninguna partícula material, ni siquiera la luz, puede escapar de ella.',
      'CC BY-SA 4.0', 0.94, 1, '2026-11-20 10:00:00'),
  (2, 1, 1, 'Dilatación del tiempo gravitacional', 'wikipedia',
      'https://es.wikipedia.org/wiki/Dilataci%C3%B3n_del_tiempo_gravitacional',
      'La dilatación del tiempo gravitacional es una diferencia en el tiempo transcurrido medida por dos observadores situados a distintas distancias de una masa gravitatoria.',
      'CC BY-SA 4.0', 0.91, 2, '2026-11-20 10:04:00'),
  (3, 1, 1, 'Horizonte de sucesos', 'wikipedia',
      'https://es.wikipedia.org/wiki/Horizonte_de_sucesos',
      'El horizonte de sucesos es la hipersuperficie frontera del espacio-tiempo tal que los eventos a un lado de ella no pueden afectar a un observador situado al otro lado.',
      'CC BY-SA 4.0', 0.88, 2, NULL),
  (4, 1, 1, 'Black Holes and Time Warps', 'openlibrary',
      'https://openlibrary.org/works/OL2010870W',
      'Kip S. Thorne, 1994. Libro de divulgación sobre agujeros negros y la curvatura del espacio-tiempo.',
      'Metadatos CC0', 0.79, 2, NULL),
  (5, 1, 2, 'Relatividad general', 'wikipedia',
      'https://es.wikipedia.org/wiki/Relatividad_general',
      'La teoría general de la relatividad es una teoría del campo gravitatorio y de los sistemas de referencia generales, publicada por Albert Einstein en 1915 y 1916.',
      'CC BY-SA 4.0', 0.86, 3, '2026-11-20 10:09:00'),
  (6, 1, 5, 'Gravitational time dilation in black hole spacetimes', 'openalex',
      'https://openalex.org/W2000000001',
      'Artículo académico sobre la medición del tiempo propio de observadores estáticos cerca de un agujero negro de Schwarzschild.',
      'Metadatos CC0', 0.72, 4, NULL),
  (7,  2,  NULL, 'Imprenta', 'wikipedia', 'https://es.wikipedia.org/wiki/Imprenta', NULL, 'CC BY-SA 4.0', 0.90, 1, '2026-11-21 11:00:00'),
  (8,  3,  NULL, 'Fotosíntesis', 'wikipedia', 'https://es.wikipedia.org/wiki/Fotos%C3%ADntesis', NULL, 'CC BY-SA 4.0', 0.92, 1, '2026-11-22 12:00:00'),
  (9,  4,  NULL, 'Ajedrez', 'wikipedia', 'https://es.wikipedia.org/wiki/Ajedrez', NULL, 'CC BY-SA 4.0', 0.89, 1, '2026-11-23 13:00:00'),
  (10, 5,  NULL, 'Mitología nórdica', 'wikipedia', 'https://es.wikipedia.org/wiki/Mitolog%C3%ADa_n%C3%B3rdica', NULL, 'CC BY-SA 4.0', 0.87, 1, '2026-11-15 16:00:00'),
  (11, 6,  NULL, 'Búsqueda en anchura', 'wikipedia', 'https://es.wikipedia.org/wiki/B%C3%BAsqueda_en_anchura', NULL, 'CC BY-SA 4.0', 0.93, 1, '2026-11-18 09:00:00'),
  (12, 7,  NULL, 'Revolución mexicana', 'wikipedia', 'https://es.wikipedia.org/wiki/Revoluci%C3%B3n_mexicana', NULL, 'CC BY-SA 4.0', 0.95, 1, '2026-11-19 09:00:00'),
  (13, 8,  NULL, 'Octopoda', 'wikipedia', 'https://es.wikipedia.org/wiki/Octopoda', NULL, 'CC BY-SA 4.0', 0.84, 1, '2026-11-20 09:00:00'),
  (14, 9,  NULL, 'Brutalismo', 'wikipedia', 'https://es.wikipedia.org/wiki/Brutalismo', NULL, 'CC BY-SA 4.0', 0.88, 1, '2026-11-21 09:00:00'),
  (15, 10, NULL, 'Acidificación del océano', 'wikipedia', 'https://es.wikipedia.org/wiki/Acidificaci%C3%B3n_del_oc%C3%A9ano', NULL, 'CC BY-SA 4.0', 0.86, 1, '2026-11-22 09:00:00');

INSERT INTO notas (nodo_id, usuario_id, texto, creado_en) VALUES
  (1, 1, 'Nota del foco: quiero entender por qué el tiempo "se estira" y no solo memorizarlo.', '2026-11-20 10:01:00'),
  (2, 1, 'Un reloj más cerca de la masa avanza más lento que uno lejano. Ejemplo: GPS corrige este efecto.', '2026-11-20 10:06:00'),
  (5, 1, 'Einstein 1915. Revisar la métrica de Schwarzschild después.', '2026-11-20 10:11:00');

INSERT INTO historial (foco_id, nodo_id, orden, accion, creado_en) VALUES
  (1, 1, 1, 'crear_foco', '2026-11-20 10:00:00'),
  (1, 2, 2, 'visitar',    '2026-11-20 10:04:00'),
  (1, 5, 3, 'visitar',    '2026-11-20 10:09:00'),
  (2, 7, 1, 'crear_foco', '2026-11-21 11:00:00'),
  (3, 8, 1, 'crear_foco', '2026-11-22 12:00:00'),
  (4, 9, 1, 'crear_foco', '2026-11-23 13:00:00'),
  (5, 10, 1, 'crear_foco', '2026-11-15 16:00:00'),
  (6, 11, 1, 'crear_foco', '2026-11-18 09:00:00'),
  (7, 12, 1, 'crear_foco', '2026-11-19 09:00:00'),
  (8, 13, 1, 'crear_foco', '2026-11-20 09:00:00'),
  (9, 14, 1, 'crear_foco', '2026-11-21 09:00:00'),
  (10, 15, 1, 'crear_foco', '2026-11-22 09:00:00');

INSERT INTO cache_api (clave_hash, fuente, respuesta_json, expira_en) VALUES
  (SHA2('wikipedia|agujero negro', 256), 'wikipedia',
   JSON_ARRAY(JSON_OBJECT(
     'titulo', 'Agujero negro', 'resumen', 'Región del espacio de la que ni la luz escapa.',
     'fuente', 'wikipedia', 'url', 'https://es.wikipedia.org/wiki/Agujero_negro',
     'licencia', 'CC BY-SA 4.0', 'anio', NULL, 'autores', JSON_ARRAY())),
   NOW() + INTERVAL 7 DAY),
  (SHA2('openlibrary|imprenta', 256), 'openlibrary',
   JSON_ARRAY(), NOW() - INTERVAL 1 DAY);

INSERT INTO donaciones (usuario_id, paypal_order_id, monto, estado, creado_en) VALUES
  (1, '5O190127TN364715T', 100.00, 'COMPLETED', '2026-11-24 20:15:00'),
  (2, '8MC585209K746392H',  50.00, 'CREATED',   '2026-11-24 21:02:00');

