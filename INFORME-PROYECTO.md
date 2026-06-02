# Informe técnico del proyecto — OpenClassy

> Documento de síntesis para revisión y defensa. Resume **qué es el proyecto**, **qué tecnologías usa**, **qué está implementado**, **qué falta** y **cómo se alinea con las rúbricas de evaluación** (DWEC, DWES, DIW y Despliegue) para optar a la máxima calificación.
>
> Fecha de la revisión: 31/05/2026 · Basado en el estado real del código del repositorio y en el contexto/enunciado de `oculto/`.

---

## 1. Resumen del proyecto

**OpenClassy** es un **LMS (Learning Management System) open source y de marca blanca** para academias de idiomas. Permite digitalizar una academia pequeña con tres diferenciadores:

- **Marca blanca (white label):** personalización estética total desde el panel de administración (temas, colores, tipografías).
- **Prueba de nivel con IA:** un visitante envía una redacción y el sistema devuelve su nivel **MCER (A1–C2)** y feedback correctivo, usando **OpenRouter** (modelo LLM).
- **Aula virtual:** cursos, materiales, tareas, entregas, notas, asistencia, mensajería interna y botón "Join Class" a la sala en vivo.

Roles del sistema: **Admin**, **Teacher** (profesor) y **Student** (alumno).

---

## 2. Stack tecnológico

| Capa | Tecnología | Detalle |
| :--- | :--- | :--- |
| **Backend** | Laravel 11 · PHP 8.2/8.3 | API REST, Service Layer, Sanctum (tokens Bearer), FormRequests, Policies, API Resources |
| **Frontend** | React 18 · Vite · React Router 7 | SPA, Axios, contextos (auth/config), SASS (ITCSS + BEM) |
| **Base de datos** | PostgreSQL 16 (local) · Neon (producción) | UUID como PK, columnas JSONB, relaciones 1:N y N:M |
| **Autenticación** | Laravel Sanctum | Token Bearer en `Authorization` (apto para dominios cruzados) |
| **IA** | OpenRouter API | `google/gemini-2.0-flash-lite-001` para corrección MCER |
| **Estilos** | SASS/SCSS | Arquitectura ITCSS, metodología BEM, `@use`/`@forward`, variables CSS dinámicas |
| **Testing** | PHPUnit 11 · Vitest + Testing Library | Feature tests de API + tests de unidad/componentes en frontend |
| **DevOps** | Docker Compose · GitHub Actions · Render | 4 servicios locales (app/db/client/nginx), CI en Actions, despliegue split en Render |

### Dependencias frontend destacadas
`axios`, `react-router-dom`, `date-fns`, `lucide-react` (iconos), `normalize.css`, `sass`.

---

## 3. Arquitectura

```
Internet
  │
  ├── Frontend  → React SPA (Vite build → dist/) — Render Static Site
  │       Consume la API vía Axios con token Bearer (VITE_API_URL)
  │
  └── Backend   → Laravel API (Docker) — Render Web Service
          API REST :$PORT ──TLS──> PostgreSQL (Neon)
                               └──> OpenRouter (IA prueba de nivel)
```

- **Separación cliente/servidor** completa: el frontend y el backend son desplegables de forma independiente.
- **Local:** `docker-compose.yml` levanta 4 servicios — `app` (Laravel FPM), `db` (PostgreSQL), `client` (Vite dev), `nginx` (reverse proxy a FPM y estáticos).
- **Producción:** frontend como **Static Site** en Render (rewrite SPA `/* → /index.html`); backend como **Web Service Docker** (`backend/Dockerfile.render`), con entrypoint que ejecuta `migrate --force` + `db:seed --force` antes de `php artisan serve`.

### Patrón MVC + Service Layer (backend)
- **Controllers** (`app/Http/Controllers`): orquestan entrada/salida HTTP.
- **Services** (`app/Services`): lógica de negocio — `LevelTestCorrectionService`, `SiteConfigService`, `StudentAssignmentService`, `CourseContentService`.
- **Models** (`app/Models`): Eloquent con relaciones y scopes (`scopeVisibleTo`).
- **FormRequests** (`app/Http/Requests`): validación separada del controlador.
- **Policies** (`app/Policies`): autorización por recurso (`CoursePolicy`, `EnrollmentPolicy`).
- **API Resources**: normalización de respuestas JSON.

---

## 4. Modelo de datos

PK con **UUID**, columnas **JSONB** y relaciones 1:1, 1:N y N:M. Entidades principales:

| Entidad | Descripción | Relaciones clave |
| :--- | :--- | :--- |
| `users` | Usuarios con rol (`admin`/`teacher`/`student`), ajustes de accesibilidad (JSONB) | 1:N con courses (como teacher), N:M con courses (via enrollments) |
| `courses` | Cursos/grupos | `teacher_id` → users, `bonus_id` → bonuses; 1:N materials/assignments/attendances |
| `enrollments` | Matrículas (tabla pivote alumno↔curso, con `status`) | N:M users↔courses |
| `bonuses` | Bonos/contratos de pago | 1:N courses |
| `materials` | Recursos (PDF/enlaces) por curso y unidad | N:1 course |
| `assignments` | Tareas con fecha de entrega y unidad | N:1 course; 1:N submissions |
| `submissions` | Entregas de alumnos (con nota) | N:1 assignment, N:1 student |
| `attendances` | Control de asistencia | N:1 course |
| `messages` + `message_recipient` | Mensajería interna | N:M emisor↔destinatarios (pivote) |
| `site_configs` | Configuración white label (tema `ui_variant`, JSON estético) | — |
| `level_tests` | Pruebas de nivel IA (UUID, `score`, `suggested_level`, `ai_analysis` JSON) | N:1 user (opcional, soporta invitados) |

> El diagrama ER detallado y el diccionario de datos están en [docs/05-diseno.md](docs/05-diseno.md).

---

## 5. API REST — diseño

- **Rutas en plural y RESTful** (`routes/api.php`): `/courses`, `/enrollments`, `/materials`, `/assignments`, `/submissions`, `/bonuses`, `/attendances`, `/messages`, `/users`…
- **Verbos HTTP correctos:** GET / POST / PUT / PATCH / DELETE.
- **Rutas anidadas** donde corresponde: `/student/courses/{course}/content`.
- **Autorización por rol mediante middleware** (`role:admin`, `role:admin,teacher`, `role:student`).
- **Throttling**: login `5,1`, prueba de nivel `6,1`.
- **Endpoints públicos:** `POST /auth/login`, `GET /site-config`, `POST /level-tests` (IA).
- **Códigos HTTP** y validación vía FormRequests (422 en errores de validación, 401/403 en auth/roles).

Ejemplos de agrupación por rol:

| Rol | Capacidades en la API |
| :--- | :--- |
| **admin** | CRUD de `users`, `courses`, `enrollments`, `bonuses`; theming (`/admin/settings`) |
| **teacher** + admin | `assignments` (CRUD), `attendances`, subir `materials`, calificar `submissions` |
| **student** | Ver sus cursos/tareas, crear `submissions` |

> Colección Postman: `backend/postman/AcademiaLMS.postman_collection.json` (+ entorno). **Falta** especificación OpenAPI/Swagger.

---

## 6. Estado de implementación

### ✅ Implementado (backend)
- API REST completa con ~46 rutas, recursos en plural y verbos correctos.
- Autenticación por **token Bearer (Sanctum)**; login/logout, perfil, contraseña, baja de cuenta.
- **Autorización con roles** vía middleware `EnsureRole` + **Policies** en recursos sensibles.
- **Service Layer** para la lógica de negocio; controladores adelgazados.
- **API Resources** normalizando las respuestas (sin wrapping global).
- **Scopes por rol** (`scopeVisibleTo`) para visibilidad de cursos/matrículas/materiales/entregas.
- **Subida de archivos** en materiales y entregas (disco `public`).
- **Prueba de nivel con IA** vía OpenRouter (servicio dedicado + prompt en backend).
- **Seeders idempotentes** de demo (`RoleUsersSeeder`, `StudentDashboardDemoSeeder`).
- **Tests Feature** sobre Auth, Course, Enrollment, Bonus, Submission, Material, SiteConfig, UserManagement, LevelTest.

### ✅ Implementado (frontend)
- Landing pública, calculadora de presupuesto **funcional**, prueba de nivel IA.
- Login con token y navegación SPA post-login; contextos `auth`/`config`.
- **Guards de ruta por rol** (`ProtectedRoute`) en `/admin/*`, `/teacher`, `/student/*`.
- Dashboard de alumno (unidades, calendario, tareas, notificaciones, sala de clase).
- Mensajería, perfil, notas del alumno.
- **Dashboard de profesor** (`TeacherDashboard.jsx`) y panel admin de theming (`AdminSettings.jsx`).
- Comunicación asíncrona centralizada con Axios (`apiClient`).
- Arquitectura **SCSS ITCSS/BEM**; componentes reutilizables.
- **Tests frontend** (Vitest): calculadora/lógica de presupuesto, `apiClient`, `levelTestService`.

### ✅ Implementado (DevOps)
- `docker-compose.yml` (app/db/client/nginx) + `Dockerfile`, `Dockerfile.render`, `frontend/Dockerfile`.
- **CI en GitHub Actions** (`.github/workflows/ci.yml`): tests backend (SQLite) + lint/build frontend + `docker compose build`.
- `config/cors.php` por env, `DB_SSLMODE` parametrizable (Neon `require`), `.env.example` afinados.
- Entrypoint de Render con `config:cache` + `route:cache` + `migrate --force` + `db:seed --force`.

### ⚠️ Parcial / pendiente
| # | Área | Estado | Acción para subir nota |
| :- | :--- | :--- | :--- |
| 1 | **README raíz** | ❌ Solo 2 líneas placeholder | Escribir README completo: descripción, requisitos, arranque local/Docker, URLs públicas, enlaces a `/docs` (lo pide la rúbrica de Despliegue) |
| 2 | **URL pública en Render** | ⚠️ Config lista, falta desplegar | Crear BD en Neon, cargar variables en panel Render, desplegar y verificar con `curl -I` + login demo |
| 3 | **OpenAPI/Swagger** | ❌ Solo Postman parcial | Completar Postman de todos los recursos o generar OpenAPI |
| 4 | **Panel admin CRUD** | ⚠️ Solo theming | Añadir gestión de usuarios/cursos/matrículas desde UI |
| 5 | **`/student/tasks`** | ⚠️ Vista incompleta | Convertir en listado real reutilizando `/student/assignments` |
| 6 | **Perfil de alumno** | ⚠️ Acciones simuladas | Conectar a endpoints reales o deshabilitar hasta implementar |
| 7 | **Accesibilidad WCAG AA** | ⚠️ Sin evidencias | `:focus-visible`, ARIA, contraste dinámico, auditoría Lighthouse |
| 8 | **Optimización multimedia** | ⚠️ Parcial | WebP/AVIF, `loading="lazy"`, `width`/`height` |
| 9 | **Enlace Figma** | ❌ Falta en docs | Añadir prototipo + guía de estilos en `docs/04` |
| 10 | **Tests frontend** | ⚠️ Base | Ampliar a guards y contextos auth/config |
| 11 | **CI trigger** | ⚠️ `main`/`master` | El despliegue usa rama `dev`; alinear el workflow con la rama de trabajo |

---

## 7. Alineación con las rúbricas (camino al 10)

### DWEC — Cliente
**Bien:** React 18 con hooks, manejo de eventos, manipulación del DOM mediante React, comunicación **asíncrona** con Axios, estados loading/error/empty, sintaxis ES moderna.
**Para 10:** ampliar tests (guards/contextos), validación visible de formularios, retirar placeholders residuales (`/student/tasks`).

### DWES — Servidor (70% backend + 30% datos)
**Bien:** API REST en plural con códigos correctos, **autenticación + autorización con roles**, MVC con **Service Layer**, FormRequests, Policies, Resources, modelo relacional rico (UUID/JSONB, 1:N y N:M), scopes, throttling y tests Feature.
**Para 10:** documentación **OpenAPI/Swagger** completa, mantener cobertura de tests, consultas complejas bien documentadas.

### DIW — Diseño de interfaces
**Bien:** SASS ITCSS/BEM, componentes reutilizables, semántica HTML5, modal accesible (foco/Escape), estados visuales, mobile-first.
**Para 10:** **enlace a Figma**, evidencias **WCAG AA** + Lighthouse, optimización de imágenes, capturas responsive por breakpoints.

### Despliegue
**Bien:** arquitectura separada en servicios, Docker local con 4 servicios + Nginx reverse proxy, CI en Actions, config de producción preparada (CORS, SSL Neon, entrypoint con migración/seed).
**Para 10:** **URL pública funcionando** (entregable mínimo), **README raíz** completo, evidencias (`curl -I`, logs de arranque, run CI en verde), prueba de carga ligera.

> ⚠️ **Entregables mínimos del enunciado** (sin ellos la nota asociada es 0): prototipo Figma funcional, repositorio cliente+servidor, documentación con los apartados pedidos y **aplicación desplegada en URL pública**. Los dos puntos a cerrar con prioridad son el **enlace a Figma** y el **despliegue público en Render**.

---

## 8. Documentación existente

La carpeta [docs/](docs/) cubre los 10+ apartados pedidos por el enunciado (con contenido real):

| Archivo | Contenido |
| :--- | :--- |
| [01-introduccion.md](docs/01-introduccion.md) | Introducción, objetivos, antecedentes |
| [02-descripcion.md](docs/02-descripcion.md) | Descripción funcional y casos de uso |
| [03-instalacion.md](docs/03-instalacion.md) | Instalación y preparación |
| [04-guia-estilos.md](docs/04-guia-estilos.md) | Guía de estilos (⚠️ falta enlace Figma) |
| [05-diseno.md](docs/05-diseno.md) | ER, diccionario de datos, casos de uso, arquitectura, API |
| [06-desarrollo.md](docs/06-desarrollo.md) | Secuencia de desarrollo y decisiones técnicas |
| [07-pruebas.md](docs/07-pruebas.md) | Metodología y tipos de pruebas |
| [08-despliegue.md](docs/08-despliegue.md) | Despliegue local Docker + Render |
| [09-manual-usuario.md](docs/09-manual-usuario.md) | Manual de usuario |
| [10-conclusiones.md](docs/10-conclusiones.md) | Conclusiones (apartado más valorado) |
| [11-componentes-frontend.md](docs/11-componentes-frontend.md) | Componentes del frontend |

> El **README.md raíz está vacío** (placeholder). Es el principal hueco documental a cerrar.

---

## 9. Cómo ejecutar (resumen rápido)

**Local con Docker:**
```bash
docker compose up -d --build      # app, db, nginx, client
# Backend API → http://localhost:8000
# Frontend    → http://localhost:5173
```

**Backend manual:**
```bash
cd backend
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan serve
```

**Frontend manual:**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run lint && npm run test && npm run build
```

**Tests:**
```bash
# Backend
cd backend && php artisan test
# Frontend
cd frontend && npm run test
```

> Variables de entorno necesarias: `OPENROUTER_API_KEY` (prueba de nivel IA), conexión PostgreSQL (`DB_*`), `CORS_ALLOWED_ORIGINS`, `VITE_API_URL` (frontend). Ver `backend/.env.example` y `frontend/.env.example`.

---

## 10. Conclusión y prioridades para máxima nota

OpenClassy está en un estado **avanzado y defendible**, por encima de un MVP, con base técnica sólida (API REST con roles/Policies/Resources/Service Layer, SPA con guards, Docker, CI y tests en ambos lados). El trabajo restante **no es ampliar alcance**, sino **cerrar y endurecer**.

**Orden recomendado de cierre (mayor impacto en rúbrica):**
1. **Desplegar en Render + Neon** y dejar la **URL pública** operativa (entregable mínimo).
2. **Enlace a Figma** en `docs/04` (entregable mínimo).
3. **README.md raíz** completo (rúbrica Despliegue – documentación).
4. **OpenAPI/Postman completo** de todos los recursos (DWES).
5. **Evidencias de accesibilidad** (Lighthouse, WCAG AA) y optimización de imágenes (DIW).
6. Completar **panel admin CRUD**, **`/student/tasks`** y conectar acciones simuladas del perfil.
7. Ampliar **tests frontend** a guards/contextos.

Cerrando los puntos 1–3 se garantiza la evaluación; los puntos 4–7 elevan la nota hacia el **10** en los cuatro módulos.
