# 08. Despliegue

## Índice

1. [Objetivo del despliegue](#1-objetivo-del-despliegue)
2. [Arquitectura general](#2-arquitectura-general)
3. [Despliegue local anterior con Docker](#3-despliegue-local-anterior-con-docker)
4. [Despliegue público en Render](#4-despliegue-público-en-render)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Base de datos y datos de demostración](#6-base-de-datos-y-datos-de-demostración)
7. [Validación previa y CI](#7-validación-previa-y-ci)
8. [Comprobaciones después del despliegue](#8-comprobaciones-después-del-despliegue)
9. [Problemas encontrados y soluciones](#9-problemas-encontrados-y-soluciones)
10. [Conclusión](#10-conclusión)

---

## 1. Objetivo del despliegue

El objetivo del despliegue de OpenClassy es demostrar que el proyecto no solo funciona en mi equipo, sino que puede ejecutarse en un entorno reproducible y también en una URL pública accesible para la entrega y la defensa.

Para cubrir los requisitos del enunciado he mantenido dos formas de despliegue:

1. Un despliegue local con Docker, pensado para desarrollo, pruebas y defensa sin depender de servicios externos.
2. Un despliegue público en Render, pensado para cumplir el requisito de aplicación desplegada en una URL accesible.

La aplicación está separada en dos partes principales: una API REST desarrollada con Laravel 11 y una SPA desarrollada con React 18 y Vite. La persistencia se realiza con PostgreSQL y la autenticación se gestiona mediante Laravel Sanctum y tokens Bearer.

---

## 2. Arquitectura general

La arquitectura del proyecto se mantiene igual en local y en producción: frontend, backend y base de datos están separados. Esto permite validar mejor cada capa y facilita cambiar el entorno de ejecución sin modificar la lógica principal de la aplicación.

| Capa | Tecnología | Responsabilidad |
| :--- | :--- | :--- |
| Frontend | React 18, Vite, SASS | Interfaz de usuario, navegación por roles y consumo de la API. |
| Backend | Laravel 11, PHP 8.3, Sanctum | API REST, autenticación, roles, validación y lógica de negocio. |
| Base de datos | PostgreSQL | Persistencia de usuarios, cursos, tareas, mensajes, entregas y configuración. |
| Automatización | Docker Compose, GitHub Actions | Ejecución reproducible, validación de tests, lint y build. |

En local se usa Nginx como proxy delante del contenedor PHP-FPM. En Render se separa el frontend como sitio estático y el backend como servicio web conectado a una base de datos PostgreSQL gestionada por la propia plataforma.

---

## 3. Despliegue local anterior con Docker

El primer despliegue del proyecto se preparó con Docker Compose. Lo mantengo documentado porque es el método más cómodo para que otra persona pueda levantar el proyecto completo desde cero sin configurar PHP, Node o PostgreSQL directamente en su sistema.

### 3.1 Servicios definidos

El archivo `docker-compose.yml` define cuatro servicios:

| Servicio | Imagen o tecnología | Puerto | Función |
| :--- | :--- | :--- | :--- |
| `app` | PHP 8.3 FPM + Laravel | Interno `9000` | Ejecuta la API y la lógica de negocio. |
| `db` | PostgreSQL 16 Alpine | `5432` | Base de datos principal. |
| `client` | Node 20 + Vite | `5173` | Servidor de desarrollo del frontend. |
| `nginx` | Nginx 1.27 Alpine | `8000` | Entrada HTTP al backend Laravel. |

### 3.2 Requisitos

Para usar este despliegue se necesita:

* Docker Desktop activo.
* Docker Compose v2.
* Git.
* Puertos libres: `5173`, `5432` y `8000`.

### 3.3 Puesta en marcha

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

Después de levantar los contenedores, se ejecutan las migraciones:

```bash
docker compose exec app php artisan migrate --force
```

Para cargar usuarios, roles y datos de demostración:

```bash
docker compose exec app php artisan db:seed --force
```

Si necesito reiniciar completamente la base de datos para una demo limpia:

```bash
docker compose exec app php artisan migrate:fresh --seed
```

### 3.4 Accesos locales

| Recurso | URL |
| :--- | :--- |
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8000` |
| API | `http://localhost:8000/api` |
| PostgreSQL | `localhost:5432` |

### 3.5 Ficheros relacionados

| Archivo | Uso |
| :--- | :--- |
| `docker-compose.yml` | Orquesta backend, base de datos, frontend y Nginx. |
| `backend/Dockerfile` | Construye la imagen PHP-FPM con extensiones `pdo_pgsql` y `pdo_sqlite`. |
| `frontend/Dockerfile` | Prepara un entorno Node 20 para servir Vite en desarrollo. |
| `docker/nginx/default.conf` | Configura Nginx para servir `backend/public` y pasar PHP a `app:9000`. |

Este despliegue local es el que he usado para validar que el proyecto puede ejecutarse de forma aislada y repetible.

---

## 4. Despliegue público en Render

El segundo despliegue se ha realizado en Render para tener una versión pública del proyecto. En este caso he separado los servicios de forma similar a la arquitectura local, pero usando servicios gestionados por Render.

### 4.1 Servicios creados

| Servicio en Render | Tipo | Directorio raíz | Función |
| :--- | :--- | :--- | :--- |
| Frontend OpenClassy | Static Site | `frontend` | Compila la SPA de React y sirve la carpeta `dist`. |
| Backend OpenClassy | Web Service | `backend` | Ejecuta Laravel y expone la API REST. |
| Base de datos OpenClassy | PostgreSQL | No aplica | Almacena la información persistente. |

URLs del despliegue:

| Recurso | URL |
| :--- | :--- |
| Frontend público | `https://open-classy-frontend-li8n.onrender.com` |
| Backend público | `https://open-classy-backend-eace.onrender.com` |
| API pública | `https://open-classy-backend-eace.onrender.com/api` |

Estas URLs se deben sustituir por las direcciones definitivas que aparecen en el panel de Render antes de la entrega final.

### 4.2 Configuración del frontend en Render

En el servicio estático del frontend he usado esta configuración:

| Campo | Valor |
| :--- | :--- |
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Node version | `20` |

La variable más importante del frontend es `VITE_API_URL`, porque indica a la SPA dónde está la API Laravel. En Render debe apuntar al backend público, sin olvidar que el cliente añade `/api` automáticamente si la URL no lo incluye.

Ejemplo:

```text
VITE_API_URL=https://open-classy-backend-eace.onrender.com
```

### 4.3 Configuración del backend en Render

El backend se despliega como servicio web desde el directorio `backend`. La aplicación necesita PHP 8.2 o superior, Composer y conexión con PostgreSQL.

Configuración usada:

| Campo | Valor |
| :--- | :--- |
| Root Directory | `backend` |
| Runtime | PHP |
| Build Command | `composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader` |
| Start Command | `php artisan serve --host=0.0.0.0 --port=$PORT` |

También es recomendable ejecutar optimizaciones propias de Laravel después de configurar las variables de entorno:

```bash
php artisan config:cache
php artisan route:cache
```

No he incluido claves privadas en el repositorio. La clave de aplicación, la conexión a la base de datos y la clave de OpenRouter se configuran desde el panel de Environment de Render.

### 4.4 Base de datos en Render

La base de datos usada en producción es PostgreSQL gestionada por Render. Desde el panel de Render se obtienen los valores de conexión y se trasladan al backend mediante variables de entorno.

Render suele entregar una URL interna de base de datos para que el backend se conecte dentro de la misma plataforma. A partir de esa información se configuran estas variables:

```text
DB_CONNECTION=pgsql
DB_HOST=<host-interno-de-render>
DB_PORT=5432
DB_DATABASE=<nombre-de-la-base-de-datos>
DB_USERNAME=<usuario-de-render>
DB_PASSWORD=<password-de-render>
```

Después del primer despliegue del backend, ejecuto las migraciones desde la consola de Render:

```bash
php artisan migrate --force
```

Si quiero dejar preparada una demo con usuarios y datos de prueba:

```bash
php artisan db:seed --force
```

---

## 5. Variables de entorno

Las variables se separan por entorno. En local algunas están definidas en `docker-compose.yml` y en los archivos `.env`. En Render se configuran desde el panel de cada servicio.

### 5.1 Backend

| Variable | Local | Render | Descripción |
| :--- | :--- | :--- | :--- |
| `APP_NAME` | `OpenClassy` | `OpenClassy` | Nombre de la aplicación. |
| `APP_ENV` | `local` | `production` | Entorno de ejecución. |
| `APP_DEBUG` | `true` | `false` | En producción no debe mostrar trazas de error. |
| `APP_KEY` | Generada o definida en Docker | Generada y copiada como secreto | Clave de cifrado de Laravel. |
| `APP_URL` | `http://localhost:8000` | URL del backend en Render | URL base del backend. |
| `DB_CONNECTION` | `pgsql` | `pgsql` | Driver de PostgreSQL. |
| `DB_HOST` | `db` | Host interno de Render | Host de base de datos. |
| `DB_PORT` | `5432` | `5432` | Puerto de PostgreSQL. |
| `DB_DATABASE` | `openclassy_db` | Base de Render | Nombre de la base de datos. |
| `DB_USERNAME` | `postgres` | Usuario de Render | Usuario de conexión. |
| `DB_PASSWORD` | `postgres` | Secreto de Render | Contraseña de conexión. |
| `CACHE_STORE` | `file` | `file` o `database` | Sistema de caché. |
| `SESSION_DRIVER` | `file` | `file` o `database` | Gestión de sesión. |
| `QUEUE_CONNECTION` | `sync` | `sync` | Procesamiento de colas en esta versión. |
| `OPENROUTER_API_KEY` | Secreto local | Secreto de Render | Clave para la corrección IA de pruebas de nivel. |
| `OPENROUTER_MODEL` | `google/gemini-2.0-flash-lite-001` | Igual | Modelo usado por el corrector. |
| `OPENROUTER_TIMEOUT` | `30` | `30` | Tiempo máximo de espera. |
| `OPENROUTER_MAX_TOKENS` | `700` | `700` | Límite de respuesta para controlar coste. |

Para generar una `APP_KEY` válida se puede ejecutar en local:

```bash
cd backend
php artisan key:generate --show
```

El resultado se copia en Render como variable `APP_KEY`.

### 5.2 Frontend

| Variable | Local | Render | Descripción |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:8000` | URL pública del backend en Render | URL base que usa Axios para consumir la API. |

En el código del cliente, `frontend/src/services/apiClient.js` normaliza la URL y añade `/api` cuando hace falta. Por eso puedo configurar `VITE_API_URL` con la URL base del backend sin repetir `/api`.

---

## 6. Base de datos y datos de demostración

Para la defensa es importante que la aplicación no aparezca vacía. Por eso el proyecto incluye seeders que preparan roles, usuarios y contenido de ejemplo.

Usuarios de prueba cargados por el seeder:

| Rol | Correo | Contraseña |
| :--- | :--- | :--- |
| Administrador | `admin@openclassy.test` | `Password123!` |
| Profesor | `teacher@openclassy.test` | `Password123!` |
| Alumno | `student@openclassy.test` | `Password123!` |

El seeder también prepara datos para el dashboard del alumno, mensajes, tareas y calendario. Esto permite enseñar flujos completos en la demo sin tener que introducir datos manualmente.

En local puedo reiniciar todo con:

```bash
docker compose exec app php artisan migrate:fresh --seed
```

En Render no conviene usar `migrate:fresh` sobre una base de datos de producción porque borra la información. Para la primera carga uso:

```bash
php artisan migrate --force
php artisan db:seed --force
```

---

## 7. Validación previa y CI

Antes de desplegar he usado las comprobaciones automáticas definidas en `.github/workflows/ci.yml`. El workflow se ejecuta en push y pull request.

Las validaciones configuradas son:

1. Backend con PHP 8.3 y SQLite para pruebas.
2. Instalación de dependencias con Composer.
3. Ejecución de `php artisan test`.
4. Frontend con Node 20.
5. Instalación con `npm ci`.
6. Revisión de código con `npm run lint`.
7. Compilación de producción con `npm run build`.
8. Build de los servicios Docker `app` y `client`.

Además, antes de cerrar el despliegue he comprobado manualmente el frontend con:

```bash
cd frontend
npm run lint
npm run build
```

Estas comprobaciones ayudan a cubrir el criterio de entrega verificable del enunciado, porque no dependo solo de probar la aplicación desde el navegador.

---

## 8. Comprobaciones después del despliegue

Después de desplegar en Render reviso estos puntos:

| Comprobación | Resultado esperado |
| :--- | :--- |
| Abrir la URL del frontend | La SPA carga sin errores de consola críticos. |
| Probar `/api/site-config` | Devuelve la configuración visual del sitio. |
| Iniciar sesión como alumno | Redirige al panel de estudiante. |
| Iniciar sesión como profesor o administrador | Aplica el rol correspondiente. |
| Entrar en mensajes | Carga mensajes o estado vacío sin quedarse bloqueado. |
| Entrar en perfil y calificaciones | Las rutas `/student/profile` y `/student/grades` funcionan. |
| Probar prueba de nivel | El backend responde y, si hay clave de OpenRouter, devuelve evaluación. |
| Revisar logs de Render | No aparecen errores 500 ni fallos de conexión a PostgreSQL. |

También compruebo que el frontend esté consumiendo el backend de Render y no la URL local. Si `VITE_API_URL` está mal configurada, la interfaz carga pero no recibe datos reales.

---

## 9. Problemas encontrados y soluciones

Durante la preparación de los despliegues he tenido en cuenta varios puntos que pueden provocar fallos:

| Problema | Causa | Solución aplicada o prevista |
| :--- | :--- | :--- |
| El frontend no carga datos en Render | `VITE_API_URL` apunta a localhost | Configurar `VITE_API_URL` con la URL pública del backend y redeplegar el frontend. |
| Error de conexión con PostgreSQL | Variables `DB_*` incompletas o usando host externo incorrecto | Usar los datos internos proporcionados por Render para el servicio backend. |
| Error 500 tras desplegar Laravel | Falta `APP_KEY` o caché antigua | Definir `APP_KEY` y ejecutar `php artisan config:clear` o redeploy. |
| La IA no corrige pruebas de nivel | Falta `OPENROUTER_API_KEY` | Añadir la clave como secreto de entorno, nunca en el repositorio. |
| La base de datos aparece vacía | No se ejecutaron seeders | Ejecutar `php artisan db:seed --force` una vez en la consola de Render. |
| Docker no arranca en local | Docker Desktop apagado o puertos ocupados | Arrancar Docker Desktop y liberar `5173`, `5432` y `8000`. |

Laravel 11 está configurado con `statefulApi()` en `bootstrap/app.php` y el frontend usa tokens Bearer guardados en `localStorage`. En este proyecto no se han subido secretos al repositorio; las claves reales se gestionan mediante variables de entorno.

---

## 10. Conclusión

Con estos dos despliegues, OpenClassy queda preparado para dos escenarios distintos. El despliegue local con Docker sirve para reproducir el proyecto completo de forma controlada, mientras que Render permite entregar una versión pública accesible desde navegador.

Esta combinación responde directamente a lo que pide el enunciado: repositorio con cliente y servidor, documentación clara, proceso de despliegue explicado, validación previa mediante CI y una aplicación publicada para poder evaluarla durante la defensa.

