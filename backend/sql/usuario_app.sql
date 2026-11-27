
CREATE USER IF NOT EXISTS 'hiperfockie_app'@'localhost'
  IDENTIFIED BY 'CAMBIA_ESTA_CLAVE';

GRANT SELECT, INSERT, UPDATE, DELETE ON hiperfockie.*      TO 'hiperfockie_app'@'localhost';

GRANT SELECT, INSERT, UPDATE, DELETE ON hiperfockie_test.* TO 'hiperfockie_app'@'localhost';

FLUSH PRIVILEGES;
