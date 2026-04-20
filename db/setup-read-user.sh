#!/bin/bash
set -e

# Este script crea un usuario con solo permisos de lectura (SELECT)
# Se ejecuta automáticamente solo cuando el volumen de la base de datos se crea por primera vez.

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<-EOSQL
    CREATE USER IF NOT EXISTS '${DB_READ_USER}'@'%' IDENTIFIED BY '${DB_READ_PASSWORD}';
    GRANT SELECT ON \`${MYSQL_DATABASE}\`.* TO '${DB_READ_USER}'@'%';
    FLUSH PRIVILEGES;
EOSQL

echo "Usuario de solo lectura '${DB_READ_USER}' creado correctamente."
