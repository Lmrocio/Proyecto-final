# OpenClassy

**LMS Open Source & White Label para Academias de Idiomas**

OpenClassy es un Sistema de Gestión de Aprendizaje (LMS) diseñado para digitalizar pequeñas academias de idiomas. Su valor diferencial es ser **Open Source**, permitir una **personalización estética total (Marca Blanca)** y automatizar procesos críticos como la **prueba de nivel mediante IA**.

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Arquitectura](#arquitectura)
3. [Requisitos previos](#requisitos-previos)
4. [Instalación con Docker (Recomendado)](#instalación-con-docker-recomendado)
5. [Instalación manual (Desarrollo)](#instalación-manual-desarrollo)
6. [Variables de entorno](#variables-de-entorno)
7. [Datos de demostración](#datos-de-demostración)
8. [Integración con IA (OpenRouter)](#integración-con-ia-openrouter)
9. [CI/CD](#cicd)
10. [Estructura del proyecto](#estructura-del-proyecto)
11. [Funcionalidades principales](#funcionalidades-principales)
12. [Documentación](#documentación)
13. [Licencia](#licencia)

---

## Stack tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Backend** | Laravel 11 (PHP 8.3+) — API RESTful |
| **Frontend** | React 18 (SPA) + Vite + SASS (ITCSS/BEM) |
| **Base de datos** | PostgreSQL 16 |
| **Autenticación** | Laravel Sanctum (Token Bearer) |
| **IA** | OpenRouter API (Gemini Flash Lite para evaluación MCER) |
| **Infraestructura** | Docker Compose (4 servicios) |
| **CI/CD** | GitHub Actions |

---

## Arquitectura

OpenClassy emplea una arquitectura **desacoplada (Headless)**: el frontend (SPA React) y el backend (API Laravel) se comunican exclusivamente mediante una interfaz JSON a través de Axios.

```
Internet
  │
  ├── Frontend  → React 18 SPA (Vite)
  │       sirve dist/ (build de producción)
  │       VITE_API_URL apunta al backend
  │
  └── Backend   → Laravel 11 API REST
          Sanctum (Token Bearer)
          Service Layer + Policies + FormRequests
          │
          ├── PostgreSQL 16 (persistencia)
          └── OpenRouter  (evaluación IA)
```

### Servicios Docker

| Servicio | Imagen / Tecnología | Puerto | Función |
| :--- | :--- | :---: | :--- |
| `app` | PHP 8.3 FPM + Laravel | `9000` (interno) | API REST y lógica de negocio |
| `db` | PostgreSQL 16 Alpine | `5432` | Base de datos principal |
| `client` | Node 20 + Vite | `5173` | Servidor de desarrollo del frontend |
| `nginx` | Nginx 1.27 Alpine | `8000` | Reverse proxy al backend |

---

## Requisitos previos

- **Docker Desktop** (v24.0+) y **Docker Compose** (v2.0+)
- **Git**
- Navegador web actualizado (Chrome, Firefox o Edge)

Si prefieres desarrollo sin Docker:

- PHP 8.2+ con extensiones `pdo_pgsql`, `bcmath`, `mbstring`
- Node.js 20+
- PostgreSQL 16+
- Composer 2+

---

## Instalación con Docker (Recomendado)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/proyecto-final.git
cd proyecto-final
```

### 2. Preparar archivos de entorno

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Levantar la infraestructura

```bash
docker compose up -d --build
```

### 4. Instalar dependencias y configurar el backend

```bash
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate:fresh --seed
```

### 5. Acceder a la aplicación

| Recurso | URL |
| :--- | :--- |
| Frontend (React) | http://localhost:5173 |
| Backend (API) | http://localhost:8000/api |

---

## Instalación manual (Desarrollo)

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `APP_NAME` | Nombre de la aplicación | `OpenClassy` |
| `APP_ENV` | Entorno de ejecución | `local` |
| `APP_KEY` | Clave de cifrado (obligatoria) | Generada con `key:generate` |
| `APP_URL` | URL base del backend | `http://localhost:8000` |
| `DB_CONNECTION` | Driver de base de datos | `pgsql` |
| `DB_HOST` | Host de PostgreSQL | `db` (Docker) / `127.0.0.1` (local) |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_DATABASE` | Nombre de la base de datos | `openclassy_db` |
| `DB_USERNAME` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `CACHE_STORE` | Sistema de caché | `file` |
| `SESSION_DRIVER` | Gestión de sesión | `file` |
| `QUEUE_CONNECTION` | Procesamiento de colas | `sync` |
| `OPENROUTER_API_KEY` | Clave de OpenRouter (IA) | *Opcional* |
| `OPENROUTER_MODEL` | Modelo LLM para evaluación | `google/gemini-2.0-flash-lite-001` |

### Frontend (`frontend/.env`)

| Variable | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL base de la API Laravel | `http://localhost:8000` |

---

## Datos de demostración

Al ejecutar `php artisan migrate:fresh --seed`, el sistema carga automáticamente:

| Rol | Correo | Contraseña |
| :--- | :--- | :--- |
| Administrador | `admin@openclassy.test` | `Password123!` |
| Profesor | `teacher@openclassy.test` | `Password123!` |
| Alumno | `student@openclassy.test` | `Password123!` |

El seeder también prepara cursos, matrículas, materiales, tareas y configuraciones de marca para una demo completa.

---

## Integración con IA (OpenRouter)

OpenClassy integra un sistema de **prueba de nivel escrita asistida por IA** que evalúa composiciones en inglés y devuelve:

- Nivel MCER sugerido (A1–C2)
- Puntuación total y por criterio
- Fortalezas detectadas
- Aspectos de mejora con sugerencias
- Recomendación para el siguiente nivel

Para activar esta funcionalidad, obtén una API Key en [openrouter.ai](https://openrouter.ai) y configura la variable `OPENROUTER_API_KEY` en el archivo `backend/.env`.

---

## CI/CD

El proyecto incluye un workflow de GitHub Actions (`.github/workflows/ci.yml`) que ejecuta automáticamente:

| Job | Acciones |
| :--- | :--- |
| **backend** | Instalación de dependencias, generación de clave, ejecución de tests con PHP 8.3 y SQLite |
| **frontend** | Instalación de dependencias, lint con ESLint, build de producción con Vite |
| **docker** | Build de las imágenes Docker `app` y `client` para validar Dockerfiles |

El workflow se ejecuta en cada push a `main`/`master` y en cada Pull Request.

---

## Estructura del proyecto

```
├── backend/                    # Laravel 11 — API REST
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/    # Controladores por recurso
│   │   │   ├── Middleware/      # EnsureRole (control por roles)
│   │   │   ├── Requests/       # FormRequests (21 validaciones)
│   │   │   └── Resources/      # API Resources (13 transformaciones)
│   │   ├── Models/             # Modelos Eloquent (11 entidades)
│   │   ├── Policies/           # CoursePolicy, EnrollmentPolicy
│   │   └── Services/           # Service Layer (4 servicios)
│   ├── database/
│   │   ├── migrations/         # 24 migraciones
│   │   └── seeders/            # Datos de demostración
│   ├── docker/                 # render-entrypoint.sh
│   ├── tests/                  # Feature tests (12) + Unit tests (1)
│   ├── Dockerfile              # PHP 8.3 FPM (local)
│   ├── Dockerfile.render       # PHP 8.3 CLI (Render)
│   └── routes/api.php          # ~50 rutas REST
├── frontend/                   # React 18 + Vite — SPA
│   ├── src/
│   │   ├── components/         # 24+ componentes reutilizables
│   │   ├── pages/              # 10 páginas + 12 admin
│   │   ├── context/            # AuthContext, ConfigContext
│   │   ├── services/           # apiClient (Axios), levelTestService
│   │   ├── styles/             # ITCSS (8 capas SCSS)
│   │   ├── layouts/            # AdminLayout, StudentLayout
│   │   └── lib/                # branding.js, budget.js
│   ├── Dockerfile              # Node 20 (desarrollo)
│   └── package.json
├── docker/
│   └── nginx/default.conf      # Configuración Nginx
├── docker-compose.yml          # Orquestación de 4 servicios
├── .github/workflows/ci.yml   # CI: tests + lint + build + Docker
├── docs/                       # Documentación del proyecto (01-11)
└── README.md
```

---

## Funcionalidades principales

### Zona pública (Captación)

- **Landing page** con oferta de cursos consumida desde la API
- **Calculadora de presupuestos** interactiva con cálculo real de semanas, matrícula y tasas
- **Prueba de nivel con IA** que evalúa composiciones en inglés y devuelve nivel MCER + feedback

### Panel de Alumno

- Dashboard con cursos, calendario, tareas y notificaciones
- Repositorio de materiales didácticos
- Entrega de tareas con subida de archivos
- Sistema de mensajería interna con profesor
- Consulta de calificaciones

### Panel de Profesor

- Gestión de cursos asignados
- Publicación de materiales y tareas
- Calificación de entregas con feedback
- Control de asistencia

### Panel de Administrador

- CRUD completo de usuarios con activar/desactivar
- Gestión de cursos, matrículas y bonos
- **Theming Engine (Marca Blanca)**: personalización visual dinámica de colores, logos y tipografías
- Dashboard de métricas de captación

### Seguridad

- Autenticación por Token Bearer (Laravel Sanctum)
- Middleware de roles (Admin, Teacher, Student)
- Policies para control de acceso a recursos
- FormRequests para validación server-side
- Throttling en login y prueba de nivel

---

## Documentación

La documentación completa del proyecto se encuentra en la carpeta [`docs/`](./docs/):

| Archivo | Contenido |
| :--- | :--- |
| [`01-introduccion.md`](./docs/01-introduccion.md) | Origen, objetivos y análisis comparativo de mercado |
| [`02-descripcion.md`](./docs/02-descripcion.md) | Descripción detallada de funcionalidades por rol |
| [`03-instalacion.md`](./docs/03-instalacion.md) | Instrucciones de instalación (Docker y manual) |
| [`04-guia-estilos.md`](./docs/04-guia-estilos.md) | Guía de estilos, paleta de colores y componentes |
| [`05-diseno.md`](./docs/05-diseno.md) | Diagrama ER, diccionario de datos, arquitectura y diseño de API |
| [`06-desarrollo.md`](./docs/06-desarrollo.md) | Decisiones técnicas, patrones de diseño y fragmentos de código |
| [`07-pruebas.md`](./docs/07-pruebas.md) | Estrategia de pruebas, suite backend y frontend |
| [`08-despliegue.md`](./docs/08-despliegue.md) | Despliegue local (Docker) y producción (Render) |
| [`09-manual-usuario.md`](./docs/09-manual-usuario.md) | Guía de uso por rol y resolución de incidencias |
| [`10-conclusiones.md`](./docs/10-conclusiones.md) | Evaluación crítica, mejoras futuras y lecciones aprendidas |
| [`11-componentes-frontend.md`](./docs/11-componentes-frontend.md) | Documentación de componentes React con props y accesibilidad |

---

## Licencia

Proyecto realizado como Trabajo Final del Grado Superior de **Desarrollo de Aplicaciones Web**.
