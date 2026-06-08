# 07. Pruebas

## 1. Estrategia de validación

La verificación del proyecto combina comprobaciones automáticas sobre el backend Laravel, la SPA React y la infraestructura mínima de despliegue. El objetivo no es solo confirmar que la aplicación compila, sino asegurar que las rutas críticas, los permisos y el flujo de entrega sean estables antes de la defensa.

### Cobertura automatizada actual

| Área | Cobertura principal |
| :--- | :--- |
| Autenticación | Login, recuperación de usuario autenticado y logout con invalidación de token. |
| Autorización | Restricción de rutas de administración para alumnos y usuarios no autorizados. |
| Cursos | Acceso autenticado obligatorio, filtrado por matrícula activa y creación por administrador. |
| Configuración pública | Recuperación de `site-config` y edición de `ui_variant` por administrador. |
| Prueba de nivel IA | Contrato del endpoint público `/api/level-tests`, incluyendo éxito y validaciones funcionales. |
| Frontend | `npm run lint` y `npm run build` para detectar errores de calidad y compilación. |
| Infraestructura | Build de imágenes Docker en CI y validación de `docker-compose.yml`. |

---

## 2. Suite del backend

Se mantiene el test específico del corrector IA y se amplía la suite con pruebas funcionales reales sobre base de datos de test:

| Fichero | Objetivo |
| :--- | :--- |
| `tests/Feature/LevelTestCorrectionTest.php` | Verifica el contrato del endpoint público de nivel. |
| `tests/Feature/AuthApiTest.php` | Valida login correcto, credenciales inválidas, sesión autenticada y logout. |
| `tests/Feature/UserManagementApiTest.php` | Confirma que solo el administrador puede crear usuarios y evita el borrado de su propia cuenta. |
| `tests/Feature/CourseApiTest.php` | Comprueba autenticación obligatoria, filtrado de cursos por matrícula activa y alta de cursos por administrador. |
| `tests/Feature/SiteConfigApiTest.php` | Valida la configuración pública y la edición de variantes visuales por administrador. |

Para que la suite sea portable, los tests de base de datos usan SQLite cuando el driver está disponible. Si el entorno local no dispone de `pdo_sqlite`, dichos tests se omiten de forma explícita y siguen ejecutándose dentro de CI o Docker.

---

## 3. Casos relevantes de la prueba de nivel IA

| Caso | Resultado esperado |
| :--- | :--- |
| Redacción válida | `201 Created` con `cefr_level`, `total_score`, `scores`, `strengths`, `improvements` y `next_level_advice`. |
| Redacción demasiado corta | `422 Unprocessable Entity` con `Escribe al menos 150 palabras para una evaluación precisa`. |
| Redacción no escrita en inglés | `422 Unprocessable Entity` con `Por favor, escribe tu redacción en inglés`. |

El test de éxito sustituye el servicio de corrección por un doble de prueba para no depender de OpenRouter ni de una clave real. Las validaciones funcionales se ejecutan antes de cualquier llamada externa, por lo que son seguras para integrarse en CI.

---

## 4. Ejecución recomendada

### Backend

```bash
cd backend
php artisan test
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### Dentro de Docker

```bash
docker compose exec app php artisan test
docker compose exec client npm run build
```

---

## 5. Integración continua

Se incorpora un workflow de GitHub Actions que ejecuta tres comprobaciones automáticas:

1. Suite backend con PHP 8.3 y SQLite.
2. Lint y build del frontend con Node 20.
3. Build de las imágenes `app` y `client` definidas en Docker.

Esto deja trazabilidad objetiva para el bloque de calidad, despliegue y mantenimiento del proyecto.

