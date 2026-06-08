# 08-despliegue-eval.md — Despliegue de la aplicación web

## Índice

1. [Arquitectura de la aplicación](#1-arquitectura-de-la-aplicación)
2. [Implementación Docker](#2-implementación-docker)
3. [Servidor web y reverse proxy (Nginx)](#3-servidor-web-y-reverse-proxy-nginx)
4. [Servidor de aplicaciones (backend)](#4-servidor-de-aplicaciones-backend)
5. [Control de versiones y CI/CD](#5-control-de-versiones-y-cicd)
6. [Gestión de ficheros y artefactos de despliegue](#6-gestión-de-ficheros-y-artefactos-de-despliegue)
7. [Verificación básica de red del despliegue](#7-verificación-básica-de-red-del-despliegue)
8. [Despliegue en Render (producción)](#8-despliegue-en-render-producción)
9. [Simulación de despliegue en VPS](#9-simulación-de-despliegue-en-vps)
10. [Documentación del despliegue](#10-documentación-del-despliegue)

---

## 1. Arquitectura de la aplicación

OpenClassy se despliega con una arquitectura **desacoplada**: el frontend (SPA React) y el backend (API Laravel) son servicios independientes que se comunican mediante peticiones HTTP con formato JSON. La base de datos PostgreSQL es compartida por el backend.

### 1.1 Arquitectura en local (Docker Compose)

```
                    ┌──────────────────────────────────────┐
                    │         Red bridge: openclassy        │
                    │                                      │
  Puerto 8000 ─────►  nginx:80 (reverse proxy)             │
                    │       │ FastCGI (app:9000)            │
                    │       ▼                               │
                    │   app: PHP 8.3 FPM + Laravel 11      │
                    │       │ Eloquent / pgsql              │
                    │       ▼                               │
                    │   db: PostgreSQL 16 (puerto 5432)     │
                    │                                      │
  Puerto 5173 ─────►  client: Node 20 + Vite (dev server)  │
                    └──────────────────────────────────────┘
```

| Servicio | Imagen base | Puerto expuesto | Función |
| :--- | :--- | :---: | :--- |
| `nginx` | `nginx:1.27-alpine` | `8000:80` | Reverse proxy HTTP, sirve estáticos de Laravel y delega PHP a FastCGI |
| `app` | `php:8.3-fpm-alpine` | `9000` (interno) | API REST, lógica de negocio, autenticación |
| `db` | `postgres:16-alpine` | `5432:5432` | Persistencia de datos |
| `client` | `node:20-alpine` | `5173:5173` | Servidor de desarrollo del frontend React |

### 1.2 Arquitectura en producción (Render)

```
  Internet
    │
    ├── Frontend (Render Static Site)
    │       build: npm ci && npm run build
    │       publish: dist/
    │       VITE_API_URL → backend público
    │
    └── Backend (Render Web Service — Docker)
            Dockerfile.render → php:8.3-cli-alpine
            entrypoint: config:cache → route:cache → migrate → seed → serve
            │
            ├── PostgreSQL (Render Managed Database)
            └── OpenRouter API (evaluación IA externa)
```

| Servicio Render | Tipo | Directorio | Función |
| :--- | :--- | :--- | :--- |
| Frontend | Static Site | `frontend/` | Compila React/Vite y sirve `dist/` |
| Backend | Web Service (Docker) | `backend/` | Ejecuta Laravel con `Dockerfile.render` |
| Database | PostgreSQL | — | Base de datos gestionada por Render |

**Ficheros clave de la arquitectura:**

| Archivo | Ruta | Propósito |
| :--- | :--- | :--- |
| `docker-compose.yml` | `/docker-compose.yml` | Orquestación de los 4 servicios en local |
| `Dockerfile` | `/backend/Dockerfile` | Imagen PHP-FPM para entorno local |
| `Dockerfile.render` | `/backend/Dockerfile.render` | Imagen PHP CLI para Render |
| `default.conf` | `/docker/nginx/default.conf` | Configuración del reverse proxy Nginx |
| `render-entrypoint.sh` | `/backend/docker/render-entrypoint.sh` | Script de arranque en Render |

---

## 2. Implementación Docker

### 2.1 Dockerfile del backend (local) — `backend/Dockerfile`

Se usa una construcción **multi-stage** para separar la instalación de dependencias de la imagen de ejecución:

- **Stage 1 (`composer:2`):** Instala dependencias PHP con `--no-dev` y `--optimize-autoloader`.
- **Stage 2 (`php:8.3-fpm-alpine`):** Imagen de producción ligera con extensiones `pdo_pgsql`, `pdo_sqlite`, `bcmath`, `intl`, `mbstring` y `opcache`.

```dockerfile
FROM composer:2 AS composer

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --no-progress \
    --optimize-autoloader

FROM php:8.3-fpm-alpine

WORKDIR /var/www/html

RUN apk add --no-cache \
    bash fcgi icu-dev libpq-dev oniguruma-dev \
    postgresql-client sqlite-dev unzip zip \
    && docker-php-ext-install \
        bcmath intl mbstring opcache pdo_pgsql pdo_sqlite

COPY --from=composer /usr/bin/composer /usr/bin/composer
COPY . .
COPY --from=composer /app/vendor ./vendor

RUN mkdir -p storage/framework/{cache,sessions,testing,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwx storage bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
```

### 2.2 Dockerfile del backend (Render) — `backend/Dockerfile.render`

Similar al anterior pero usa `php:8.3-cli-alpine` (no FPM) porque Render asigna un puerto y espera un proceso CLI:

```dockerfile
FROM composer:2 AS composer

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev --prefer-dist --no-interaction --no-progress \
    --optimize-autoloader --no-scripts

FROM php:8.3-cli-alpine

WORKDIR /var/www/html

RUN apk add --no-cache postgresql-dev oniguruma-dev unzip \
    && docker-php-ext-install mbstring opcache pdo_pgsql

COPY --from=composer /usr/bin/composer /usr/bin/composer
COPY . .
COPY --from=composer /app/vendor ./vendor

RUN composer run-script post-autoload-dump 2>/dev/null || true
RUN mkdir -p storage/framework/{cache,sessions,testing,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+w storage bootstrap/cache
RUN chmod +x docker/render-entrypoint.sh

EXPOSE 10000
CMD ["sh", "docker/render-entrypoint.sh"]
```

### 2.3 Dockerfile del frontend — `frontend/Dockerfile`

Imágen de desarrollo basada en Node 20 que ejecuta Vite en modo dev:

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### 2.4 Entrypoint de Render — `backend/docker/render-entrypoint.sh`

Se ejecuta al arrancar el contenedor en Render. Cachéa configuración y rutas, aplica migraciones, carga seeders y arranca el servidor:

```bash
#!/bin/sh
set -e

php artisan config:cache
php artisan route:cache
php artisan migrate --force
php artisan db:seed --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
```

**Detalles de diseño:**
- `config:cache` y `route:cache` se ejecutan en runtime porque Render inyecta las variables de entorno después del build.
- Los seeders son idempotentes (`updateOrCreate`), por lo que es seguro ejecutarlos en cada despliegue.
- `exec` reemplaza el proceso shell por el de PHP, evitando señales huérfanas.

---

## 3. Servidor web y reverse proxy (Nginx)

En el despliegue local, **Nginx** actúa como punto de entrada HTTP y como reverse proxy hacia el contenedor PHP-FPM.

### 3.1 Configuración — `docker/nginx/default.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/html/public;
    index index.php index.html;

    client_max_body_size 25M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }

    location = /robots.txt {
        access_log off;
        log_not_found off;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/html/public$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT /var/www/html/public;
        fastcgi_pass app:9000;
        fastcgi_index index.php;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

**Explicación de las directives clave:**

| Directive | Función |
| :--- | :--- |
| `listen 80` | Escucha en el puerto 80 dentro del contenedor (mapeado al 8000 del host) |
| `root /var/www/html/public` | Apunta al directorio público de Laravel |
| `try_files $uri $uri/ /index.php?$query_string` | Redirige rutas no estáticas al front controller de Laravel |
| `fastcgi_pass app:9000` | Conecta con el contenedor `app` (PHP-FPM) vía FastCGI en el puerto 9000 |
| `client_max_body_size 25M` | Limita subida de archivos a 25 MB |
| `location ~ /\.(?!well-known).*` | Bloquea acceso a archivos ocultos (`.env`, `.git`) excepto `/.well-known` |

### 3.2 Flujo de una petición en local

```
Navegador → localhost:8000 → nginx:80
    │
    ├── Archivo estático (CSS/JS/imagen) → sirve directamente desde /public
    │
    └── Ruta dinámica (/api/courses) → try_files → /index.php
            → fastcgi_pass app:9000
            → Laravel procesa la petición
            → Respuesta JSON al navegador
```

En **producción con Render**, este proxy no es necesario: el frontend es un Static Site servido directamente por Render y el backend usa `php artisan serve` con el puerto asignado por la plataforma.

---

## 4. Servidor de aplicaciones (backend)

### 4.1 Configuración de Laravel en producción

Las optimizaciones aplicadas al backend para producción se ejecutan en el entrypoint:

| Comando | Propósito |
| :--- | :--- |
| `php artisan config:cache` | Cachea todas las configuraciones en un único archivo |
| `php artisan route:cache` | Cachea el registro de rutas para evitar parsing en cada petición |
| `php artisan migrate --force` | Aplica migraciones pendientes sin confirmación interactiva |
| `php artisan db:seed --force` | Carga datos de demostración (idempotente) |

### 4.2 Variables de entorno en producción

Las variables se configuran en el panel de Render (nunca en el repositorio):

```text
APP_ENV=production
APP_DEBUG=false
APP_URL=https://open-classy-backend-eace.onrender.com
FRONTEND_URL=https://open-classy-frontend-li8n.onrender.com
CORS_ALLOWED_ORIGINS=https://open-classy-frontend-li8n.onrender.com

DB_CONNECTION=pgsql
DB_HOST=ep-xxxx-xxxx.eu-central-1.aws.neon.tech
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=neondb_owner
DB_PASSWORD=<secreto-de-neon>
DB_SSLMODE=require

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync

OPENROUTER_API_KEY=<secreto-de-openrouter>
OPENROUTER_MODEL=google/gemini-2.0-flash-lite-001
```

**Archivo de referencia:** `backend/.env.example` contiene un bloque comentado con esta configuración (líneas 130–168).

### 4.3 CORS entre dominios distintos

El frontend y backend se ejecutan en dominios diferentes en Render. La configuración CORS (`backend/config/cors.php`) lee `CORS_ALLOWED_ORIGINS` del entorno:

```php
$allowedOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000'))
)));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $allowedOrigins,
    'allowed_headers' => ['*'],
    'supports_credentials' => false,  // Token Bearer, no cookies cross-site
];
```

### 4.4 Persistencia de datos

- **Local:** PostgreSQL corre como contenedor Docker con un volumen persistente (`postgres-data`).
- **Producción (Render):** PostgreSQL gestionado por Render (o Neon). Las migraciones se ejecutan automáticamente en cada despliegue via entrypoint. Los seeders son idempotentes (`updateOrCreate`), por lo que re-ejecutarlos no duplica datos.

---

## 5. Control de versiones y CI/CD

### 5.1 GitHub Actions — `.github/workflows/ci.yml`

El workflow se ejecuta en cada **push a `main`/`master`** y en cada **Pull Request**. Consta de 3 jobs independientes que se ejecutan en paralelo:

#### Job 1: `backend` (tests)

```yaml
backend:
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: backend
  env:
    APP_ENV: testing
    DB_CONNECTION: sqlite
    DB_DATABASE: database/testing.sqlite
    CACHE_STORE: array
    SESSION_DRIVER: array
    QUEUE_CONNECTION: sync
  steps:
    - uses: actions/checkout@v4
    - uses: shivammathur/setup-php@v2
      with:
        php-version: '8.3'
        extensions: mbstring, intl, sqlite3, pdo_sqlite
    - run: |
        cp .env.example .env
        mkdir -p database
        touch database/testing.sqlite
        composer install --no-interaction --prefer-dist --ansi
        php artisan key:generate --ansi
    - run: php artisan test --ansi
```

**Detalles:**
- Usa **SQLite** en lugar de PostgreSQL para los tests (más rápido, sin dependencia de servicio externo).
- Sobreescribe variables de entorno para aislar el entorno de pruebas.
- Ejecuta la suite completa de Feature Tests.

#### Job 2: `frontend` (lint + build)

```yaml
frontend:
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: frontend
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: npm
        cache-dependency-path: frontend/package-lock.json
    - run: npm ci
    - run: npm run lint
    - run: npm run build
```

**Detalles:**
- `npm ci` instala dependencias exactas desde `package-lock.json`.
- `npm run lint` ejecuta ESLint para detectar errores de calidad.
- `npm run build` compila el bundle de producción con Vite.

#### Job 3: `docker` (build de imágenes)

```yaml
docker:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: docker compose build app client
```

**Detalles:**
- Valida que los Dockerfiles compilan correctamente sin errores.
- No ejecuta los contenedores, solo verifica que las imágenes se construyen.

### 5.2 Estructura de ramas

```text
main ─── rama estable, desplegable
  │
  ├── dev ─── rama de desarrollo, auto-deploy en Render
  │     │
  │     ├── feat/xxx ─── funcionalidades
  │     ├── fix/xxx ─── correcciones
  │     └── docs/xxx ─── documentación
  │
  └── pull requests ─── revisión antes de merge a main
```

### 5.3 CD (despliegue continuo) en Render

Render ejecuta automáticamente un **rebuild y redeploy** cuando detecta un push a la rama `dev` configurada en cada servicio. No se usa `render.yaml` ni blueprint; el auto-redeploy nativo es suficiente para este alcance.

---

## 6. Gestión de ficheros y artefactos de despliegue

### 6.1 Ficheros que participan en el despliegue

| Fichero | Ubicación | Rol en despliegue |
| :--- | :--- | :--- |
| `docker-compose.yml` | `/docker-compose.yml` | Define y orquesta los 4 servicios locales |
| `backend/Dockerfile` | `/backend/Dockerfile` | Construye la imagen PHP-FPM para local |
| `backend/Dockerfile.render` | `/backend/Dockerfile.render` | Construye la imagen PHP CLI para Render |
| `backend/docker/render-entrypoint.sh` | `/backend/docker/render-entrypoint.sh` | Script de arranque en Render (migrate + seed + serve) |
| `docker/nginx/default.conf` | `/docker/nginx/default.conf` | Configuración del reverse proxy Nginx |
| `.github/workflows/ci.yml` | `/.github/workflows/ci.yml` | Pipeline de CI: tests, lint, build, Docker |
| `backend/.env.example` | `/backend/.env.example` | Plantilla de variables de entorno (sin secretos) |
| `frontend/.env.example` | `/frontend/.env.example` | Plantilla de variable del frontend |
| `backend/composer.json` | `/backend/composer.json` | Dependencias PHP (instaladas en el stage 1 del Dockerfile) |
| `frontend/package.json` | `/frontend/package.json` | Dependencias Node (instaladas via `npm ci`) |
| `backend/config/cors.php` | `/backend/config/cors.php` | Configuración CORS dinámica por variable de entorno |
| `backend/config/database.php` | `/backend/config/database.php` | Conexión PostgreSQL con `sslmode` parametrizable |

### 6.2 Artefactos generados durante el despliegue

| Artefacto | Generado por | Propósito |
| :--- | :--- | :--- |
| `vendor/` | `composer install` (stage 1 del Dockerfile) | Dependencias PHP optimizadas |
| `node_modules/` | `npm ci` (Dockerfile frontend o build de Render) | Dependencias Node |
| `dist/` | `npm run build` (Vite) | Bundle de producción del frontend |
| `bootstrap/cache/*.php` | `php artisan config:cache` / `route:cache` | Archivos de caché de configuración y rutas |
| Imagen Docker `openclassy-app` | `docker compose build` | Imagen del backend con todas las dependencias |
| Imagen Docker `openclassy-client` | `docker compose build` | Imagen del frontend con Node y Vite |

### 6.3 Gestión de secretos

**Regla:** Ningún secreto se sube al repositorio. Todos los valores sensibles se gestionan como variables de entorno.

| Secreto | Dónde se configura | Dónde se lee |
| :--- | :--- | :--- |
| `APP_KEY` | Panel de Render (o `.env` local) | `backend/.env` |
| `DB_PASSWORD` | Panel de Render | `config/database.php` via `env()` |
| `OPENROUTER_API_KEY` | Panel de Render (o `.env` local) | `config/services.php` via `env()` |
| Token Sanctum | Generado en runtime | `localStorage` del frontend |

El `.gitignore` excluye explícitamente `.env` y `oculto/`:

```gitignore
oculto
.env
```

### 6.4 Persistencia de volumen en Docker

```yaml
# docker-compose.yml (fragmento)
volumes:
  postgres-data:

services:
  db:
    image: postgres:16-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

El volumen nombrado `postgres-data` preserva los datos de PostgreSQL entre reinicios del contenedor. En Render, la persistencia la gestiona el servicio de base de datos managed.

---

## 7. Verificación básica de red del despliegue

### 7.1 Verificación en local (Docker Compose)

Una vez levantados los contenedores, se verifican los componentes de red en este orden:

**Paso 1: Comprobar que los contenedores están en marcha**

```bash
docker compose ps
```

Salida esperada:

```text
NAME                SERVICE      STATUS       PORTS
openclassy-app      app          running
openclassy-db       db           running      0.0.0.0:5432->5432/tcp
openclassy-client   client       running      0.0.0.0:5173->5173/tcp
openclassy-nginx    nginx        running      0.0.0.0:8000->80/tcp
```

[Captura 1. Salida de `docker compose ps` mostrando los 4 contenedores en estado `running`]

**Paso 2: Verificar conectividad del backend vía Nginx**

```bash
curl -I http://localhost:8000/api/site-config
```

Salida esperada:

```text
HTTP/1.1 200 OK
Server: nginx/1.27-alpine
Content-Type: application/json
X-Powered-By: Laravel
```

[Captura 2. Salida de `curl -I` mostrando HTTP 200 y los headers de Nginx y Laravel]

**Paso 3: Verificar que el frontend carga**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```

Salida esperada:

```text
200
```

**Paso 4: Verificar conexión a PostgreSQL**

```bash
docker compose exec db pg_isready -U postgres -d openclassy_db
```

Salida esperada:

```text
localhost:5432 - accepting connections
```

[Captura 3. Salida de `pg_isready` confirmando que PostgreSQL acepta conexiones]

**Paso 5: Verificar login desde la red Docker**

```bash
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@openclassy.test","password":"Password123!"}' | head -c 200
```

Salida esperada (token truncado):

```json
{"token":"eyJ...","user":{"id":"...","name":"...","email":"admin@openclassy.test","role":"admin"}}
```

[Captura 4. Respuesta JSON del login con token y datos del usuario]

### 7.2 Verificación en producción (Render)

**Paso 1: Health check del backend**

```bash
curl -I https://open-classy-backend-eace.onrender.com/api/site-config
```

Salida esperada:

```text
HTTP/2 200
content-type: application/json
```

[Captura 5. Salida de `curl -I` contra el backend en Render mostrando HTTP/2 200]

**Paso 2: Verificar que el frontend consume el backend correcto**

Al abrir la URL del frontend en el navegador, la pestaña **Network** de las DevTools debe mostrar peticiones a `open-classy-backend-eace.onrender.com`, no a `localhost`.

[Captura 6. Pestaña Network de DevTools mostrando peticiones al dominio de Render]

**Paso 3: Verificar CORS**

```bash
curl -s -I -X OPTIONS https://open-classy-backend-eace.onrender.com/api/auth/login \
  -H "Origin: https://open-classy-frontend-li8n.onrender.com" \
  -H "Access-Control-Request-Method: POST"
```

Salida esperada:

```text
HTTP/2 204
access-control-allow-origin: https://open-classy-frontend-li8n.onrender.com
access-control-allow-methods: POST
```

[Captura 7. Respuesta CORS con los headers `access-control-allow-origin` correctos]

**Paso 4: Verificar que los secretos no están expuestos**

```bash
curl -s https://open-classy-backend-eace.onrender.com/.env
```

Salida esperada: Error 404 o página de bienvenida de Laravel (nunca el contenido de `.env`).

```text
HTTP/2 404
```

### 7.3 Resumen de verificaciones de red

| Verificación | Comando | Resultado esperado |
| :--- | :--- | :--- |
| Contenedores activos | `docker compose ps` | 4 contenedores `running` |
| Backend responde | `curl -I localhost:8000/api/site-config` | HTTP 200 |
| Frontend carga | `curl -s -o /dev/null -w "%{http_code}" localhost:5173` | 200 |
| PostgreSQL acepta conexiones | `docker compose exec db pg_isready` | `accepting connections` |
| Login funcional | `curl -X POST localhost:8000/api/auth/login ...` | JSON con token |
| Backend producción | `curl -I https://open-classy-backend-eace.onrender.com/api/site-config` | HTTP 200 |
| CORS configurado | `curl -I -X OPTIONS ...` | `access-control-allow-origin` presente |
| Secretos protegidos | `curl .../.env` | 404 |

---

## 8. Despliegue en Render (producción)

### 8.1 Proceso de despliegue del frontend

| Paso | Acción | Resultado |
| :---: | :--- | :--- |
| 1 | Push a rama `dev` | Render detecta el cambio y arranca el build |
| 2 | `npm ci` | Instala dependencias exactas |
| 3 | `npm run build` | Vite genera `dist/` con CSS, JS e imágenes optimizados |
| 4 | Publica `dist/` | Render sirve los archivos estáticos |
| 5 | Rewrite SPA `/* → /index.html` | Configurado en el panel de Render para que React Router funcione |

**Configuración del servicio Static Site en Render:**

| Campo | Valor |
| :--- | :--- |
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Node version | `20` |
| Variable de entorno | `VITE_API_URL=https://open-classy-backend-eace.onrender.com` |

### 8.2 Proceso de despliegue del backend

| Paso | Acción | Resultado |
| :---: | :--- | :--- |
| 1 | Push a rama `dev` | Render detecta el cambio y arranca el build |
| 2 | `composer install --no-dev` | Instala dependencias PHP sin paquetes de desarrollo |
| 3 | Build de imagen Docker | `Dockerfile.render` genera la imagen |
| 4 | `config:cache` + `route:cache` | Optimización de Laravel |
| 5 | `migrate --force` | Aplica migraciones pendientes |
| 6 | `db:seed --force` | Carga datos de demo (idempotente) |
| 7 | `php artisan serve --port=$PORT` | Arranca la API en el puerto asignado por Render |

**Configuración del servicio Web Service en Render:**

| Campo | Valor |
| :--- | :--- |
| Runtime | Docker |
| Dockerfile Path | `backend/Dockerfile.render` |
| Root Directory | `backend` |
| Puerto | `10000` (expuesto en el Dockerfile) |
| Variables de entorno | Configuradas en el panel (APP_KEY, DB_*, OPENROUTER_*) |

### 8.3 Rollback

Si un despliegue falla, Render permite volver a la versión anterior desde el panel de servicios con un clic en "Rollback to previous deploy". No se requiere intervención manual adicional.

---

## 9. Simulación de despliegue en VPS

Aunque el proyecto actual se despliega en Render, a continuación se documenta cómo se realizaría un despliegue en una **VPS** (por ejemplo, DigitalOcean, Hetzner o AWS EC2) con Ubuntu 24.04, dado que el profesor solicita evidencia de conocimiento sobre despliegue en este tipo de entorno.

### 9.1 Preparación del servidor

```bash
# Conexión SSH
ssh root@<ip-del-servidor>

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# Instalar Git
apt install -y git

# Clonar el repositorio
git clone https://github.com/tu-usuario/proyecto-final.git /var/www/openclassy
cd /var/www/openclassy
```

### 9.2 Configurar variables de entorno

```bash
# Backend
cp backend/.env.example backend/.env
php -r "echo 'APP_KEY=base64:' . base64_encode(random_bytes(32)) . PHP_EOL;" >> backend/.env

# Editar las variables de producción
nano backend/.env
```

Variables a editar en `backend/.env`:

```text
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tu-dominio.com
FRONTEND_URL=https://tu-dominio.com
CORS_ALLOWED_ORIGINS=https://tu-dominio.com
DB_HOST=localhost
DB_DATABASE=openclassy
DB_USERNAME=openclassy_user
DB_PASSWORD=<contraseña-segura>
DB_SSLMODE=prefer
```

### 9.3 Desplegar con Docker Compose

```bash
# Levantar servicios (sin el frontend client, que se sirve con nginx)
docker compose up -d --build app db nginx

# Ejecutar migraciones y seed
docker compose exec app php artisan migrate --force
docker compose exec app php artisan db:seed --force
```

### 9.4 Configurar Nginx como proxy inverso frontal (producción)

En una VPS, Nginx se ejecuta directamente en el host (no en un contenedor) y se encarga de:

1. Servir el **frontend estático** (el `dist/` construido por Vite).
2. Hacer **reverse proxy** al backend Laravel en el contenedor Docker.
3. Gestionar **HTTPS** con Let's Encrypt.

```nginx
# /etc/nginx/sites-available/openclassy

server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend estático
    root /var/www/openclassy/frontend/dist;
    index index.html;

    # SPA fallback para React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API → reverse proxy al contenedor Docker
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Sanctum CSRF
    location /sanctum/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Seguridad: bloquear archivos ocultos
    location ~ /\. {
        deny all;
    }
}
```

### 9.5 Habilitar HTTPS con Certbot

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d tu-dominio.com
```

### 9.6 Construir el frontend para producción

```bash
cd /var/www/openclassy/frontend

# Configurar la variable de entorno de producción
echo "VITE_API_URL=https://tu-dominio.com" > .env

# Instalar dependencias y construir
npm ci
npm run build

# Los archivos estáticos quedan en dist/
ls dist/
# index.html  assets/
```

### 9.7 Comandos de mantenimiento

| Tarea | Comando |
| :--- | :--- |
| Ver logs del backend | `docker compose logs -f app` |
| Reiniciar backend | `docker compose restart app` |
| Actualizar código | `git pull && docker compose up -d --build app` |
| Ejecutar migraciones | `docker compose exec app php artisan migrate --force` |
| Limpiar caché | `docker compose exec app php artisan cache:clear` |
| Ver estado de contenedores | `docker compose ps` |

---

## 10. Documentación del despliegue

### 10.1 Cobertura documental

| Documento | Contenido | Estado |
| :--- | :--- | :---: |
| `README.md` | Instrucciones de instalación (Docker + manual), stack, arquitectura, variables de entorno | Completado |
| `docs/03-instalacion.md` | Requisitos previos, Docker, instalación manual, scripts | Completado |
| `docs/08-despliegue.md` | Arquitectura, Docker local, Render, variables, CI, troubleshooting | Completado |
| `docs/08-despliegue-eval.md` | Evaluación técnica con evidencias (este documento) | Completado |

### 10.2 Archivos de configuración versionados

| Archivo | Propósito |
| :--- | :--- |
| `docker-compose.yml` | Orquestación de servicios locales |
| `backend/Dockerfile` | Imagen PHP-FPM para local |
| `backend/Dockerfile.render` | Imagen PHP CLI para Render |
| `backend/docker/render-entrypoint.sh` | Script de arranque en Render |
| `docker/nginx/default.conf` | Configuración de Nginx |
| `.github/workflows/ci.yml` | Pipeline de CI/CD |
| `backend/.env.example` | Plantilla de variables (sin secretos) |
| `frontend/.env.example` | Plantilla de variable del frontend |

### 10.3 Justificación de decisiones de despliegue

| Decisión | Justificación |
| :--- | :--- |
| **Render como plataforma** | Ofrece Static Site (frontend) y Web Service con Docker (backend) en un solo panel. Auto-redeploy al hacer push. Sin necesidad de configurar `render.yaml`. |
| **Neon como base de datos** | PostgreSQL serverless con tier gratuito. Compatible con SSL (`DB_SSLMODE=require`). |
| **Sin reverse proxy propio en producción** | Render gestiona HTTPS y el balanceo. El frontend es estático y el backend se expone directamente. |
| **SQLite en tests CI** | Elimina la dependencia de un servicio PostgreSQL en GitHub Actions, reduciendo tiempo de ejecución y complejidad. |
| **Seeders idempotentes** | Permiten ejecutar `db:seed` en cada despliegue sin duplicar datos, usando `updateOrCreate` en lugar de `insert`. |
| **Token Bearer (no cookies)** | Frontend y backend en dominios distintos. Los tokens en `localStorage` evitan problemas de cookies cross-site. |
