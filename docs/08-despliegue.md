# 08. Despliegue

## 1. Objetivo del despliegue

El despliegue de OpenClassy persigue dos metas: ofrecer una ejecución reproducible para la defensa del proyecto y disponer de una base técnica realista para evolución posterior. La solución adoptada separa claramente el backend Laravel, la SPA React, la base de datos PostgreSQL y la capa de exposición HTTP.

---

## 2. Arquitectura de despliegue

La solución se organiza en cuatro servicios definidos en `docker-compose.yml`:

| Servicio | Tecnología | Responsabilidad |
| :--- | :--- | :--- |
| `app` | PHP 8.3 FPM + Laravel 11 | Ejecuta la API REST y la lógica de negocio. |
| `db` | PostgreSQL 16 | Persistencia principal del sistema. |
| `client` | Node 20 + Vite | Sirve la SPA de React en modo desarrollo controlado. |
| `nginx` | Nginx Alpine | Expone el backend y enruta las peticiones PHP hacia `app`. |

Esta estructura permite demostrar desacoplamiento real entre cliente y servidor y facilita validar cada capa por separado.

---

## 3. Despliegue local con Docker

### 3.1 Requisitos

*   Docker Desktop activo.
*   Docker Compose v2.
*   Puertos disponibles `5173`, `5432` y `8000`.

### 3.2 Puesta en marcha

```bash
docker compose up -d --build
```

Una vez construidos los contenedores, se recomienda inicializar la base de datos:

```bash
docker compose exec app php artisan migrate --force
```

Si se desea cargar datos de demostración para la defensa:

```bash
docker compose exec app php artisan db:seed --force
```

### 3.3 Accesos

*   Frontend: `http://localhost:5173`
*   Backend/API: `http://localhost:8000`
*   PostgreSQL: `localhost:5432`

---

## 4. Contenedores y ficheros clave

| Archivo | Propósito |
| :--- | :--- |
| `backend/Dockerfile` | Imagen PHP-FPM con extensiones para PostgreSQL y SQLite de test. |
| `frontend/Dockerfile` | Imagen Node 20 para ejecutar Vite en entorno controlado. |
| `docker-compose.yml` | Orquestación completa de backend, cliente, base de datos y proxy web. |
| `docker/nginx/default.conf` | Configuración de Nginx para servir el `public` de Laravel. |

El `backend/Dockerfile` incluye `pdo_pgsql` para la base de datos principal y `pdo_sqlite` para ejecutar pruebas automatizadas dentro de contenedor o CI.

---

## 5. Integración continua y validación previa al despliegue

Se añade el workflow `.github/workflows/ci.yml` con tres comprobaciones:

1. Tests backend con PHP 8.3 y SQLite.
2. Lint y build del frontend con Node 20.
3. Build de imágenes Docker para detectar roturas de infraestructura antes de fusionar cambios.

Este pipeline permite rechazar cambios que rompan la aplicación sin necesidad de validación manual completa.

---

## 6. Procedimiento recomendado para una entrega o demostración

1. Ejecutar `docker compose up -d --build`.
2. Aplicar migraciones con `docker compose exec app php artisan migrate --force`.
3. Sembrar datos demo si la presentación lo requiere.
4. Comprobar `/api/site-config`, `/api/auth/login` y `/api/level-tests`.
5. Abrir la SPA y verificar navegación por roles.

---

## 7. Riesgos y consideraciones actuales

*   El contenedor `client` está orientado a un escenario de validación y defensa; para producción convendría servir la SPA compilada desde Nginx o un CDN.
*   La clave `OPENROUTER_API_KEY` debe inyectarse como secreto de entorno y no fijarse en una imagen.
*   Si Docker Desktop no está iniciado, `docker compose build` y `docker compose up` fallarán aunque la sintaxis del stack sea correcta.

Con esta base, OpenClassy ya dispone de un despliegue reproducible, portable y verificable, alineado con los criterios de DevOps exigidos en el proyecto.

