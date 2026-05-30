#!/bin/sh
set -e

# Entrypoint de producción para Render (Web Service Docker).
# La base de datos (Neon) es desechable: no hay migración de datos a preservar.

# Cachear configuración y rutas en runtime: las variables de entorno ya están
# inyectadas por Render en este punto (no en tiempo de build).
php artisan config:cache
php artisan route:cache

# Aplicar migraciones y sembrar datos demo. Los seeders son idempotentes
# (updateOrCreate), por lo que es seguro ejecutarlos en cada despliegue.
php artisan migrate --force
php artisan db:seed --force

# Servir la API en el puerto que asigna Render (PORT) o 10000 por defecto.
exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
