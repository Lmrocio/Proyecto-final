# 03. Instalación y Preparación (PRIMERA VERSIÓN)

## Índice
1. [Requisitos Previos](#1-requisitos-previos)
2. [Configuración de Variables de Entorno](#2-configuración-de-variables-de-entorno)
3. [Instalación mediante Docker (Recomendado)](#3-instalación-mediante-docker-recomendado)
4. [Instalación Manual (Desarrollo)](#4-instalación-manual-desarrollo)
5. [Scripts de Utilidad](#5-scripts-de-utilidad)

---

## 1. Requisitos Previos

Para garantizar la correcta ejecución del ecosistema OpenClassy, el sistema anfitrión debe contar con las siguientes herramientas instaladas:

*   **Docker Desktop** (v24.0 o superior) y **Docker Compose** (v2.0 o superior).
*   **Git** para el control de versiones.
*   **Navegador Web actualizado** (Chrome, Firefox o Edge) para plena compatibilidad con React 18.

### Versiones de Software (Contenedores):
*   **Backend:** PHP 8.3 (Laravel 11).
*   **Frontend:** Node.js 20 (Vite + React 18).
*   **Base de Datos:** PostgreSQL 16.
*   **Servidor Web:** Nginx 1.25.

---

## 2. Configuración de Variables de Entorno

El proyecto requiere dos archivos de configuración `.env`. Se deben copiar los archivos de ejemplo y editar los valores necesarios.

### 2.1 Backend (`/backend/.env`)
| Variable | Descripción | Valor Recomendado |
| :--- | :--- | :--- |
| `APP_ENV` | Entorno de ejecución | `local` |
| `APP_KEY` | Llave de encriptación | Generada con `php artisan key:generate` |
| `DB_CONNECTION` | Driver de base de datos | `pgsql` |
| `DB_HOST` | Host de la base de datos | `db` (nombre del servicio en Docker) |
| `DB_PORT` | Puerto de la base de datos | `5432` |
| `DB_DATABASE` | Nombre de la base de datos | `openclassy_db` |
| `OPENROUTER_API_KEY` | Token para la IA | *Obtenido en openrouter.ai* |

### 2.2 Frontend (`/frontend/.env`)
| Variable | Descripción | Valor Recomendado |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | URL de la API de Laravel | `http://localhost:8000/api` |

---

## 3. Instalación mediante Docker (Recomendado)

OpenClassy está contenedorizado para facilitar su despliegue inmediato y evitar el conflicto de versiones en el sistema local ("en mi ordenador funcionaba").

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/lmrocio-proyecto-final.git
    cd lmrocio-proyecto-final
    ```

2.  **Preparar archivos de entorno:**
    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```

3.  **Levantar la infraestructura:**
    ```bash
    docker-compose up -d --build
    ```
    *Este comando orquesta los contenedores de la API, el Cliente, la DB y Nginx.*

4.  **Instalar dependencias y configurar Backend:**
    ```bash
    docker-compose exec app composer install
    docker-compose exec app php artisan key:generate
    docker-compose exec app php artisan migrate:fresh --seed
    ```
    *El comando `migrate:fresh --seed` es vital para cargar los roles y usuarios de prueba para la demo.*

5.  **Acceso a la aplicación:**
    *   **Frontend (React):** [http://localhost:5173](http://localhost:5173)
    *   **Backend (API/Laravel):** [http://localhost:8000](http://localhost:8000)

---

## 4. Instalación Manual (Desarrollo)

Si se prefiere no usar contenedores, se deben ejecutar los siguientes pasos (requiere PHP 8.3, Node.js 20 y PostgreSQL instalados localmente):

### Backend:
```bash
cd backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

## 5. Scripts y Dockerfiles

Para asegurar la máxima nota en el bloque de **Despliegue y DevOps**, se han configurado los siguientes archivos de automatización:

*   **`backend/Dockerfile`**: Configurado para optimizar Laravel 11, instalando las extensiones `pdo_pgsql` y `bcmath` necesarias para el motor de cálculos de presupuestos. Utiliza una imagen base de PHP 8.3-FPM para garantizar un entorno de ejecución ligero y seguro.
*   **`frontend/Dockerfile`**: Implementa una construcción multietapa (*multi-stage build*). En la primera fase, utiliza Node.js 20 para compilar los assets de React mediante Vite; en la segunda fase, traslada el *build* a un servidor Nginx 1.25 optimizado, reduciendo drásticamente el peso de la imagen final y mejorando el tiempo de respuesta.
*   **`docker-compose.yml`**: Orquesta los cuatro contenedores principales (`app`, `db`, `client`, `nginx`) definiendo una red interna aislada. Además, gestiona volúmenes persistentes para que los datos almacenados en PostgreSQL no se pierdan al reiniciar el ecosistema.

---

## Justificación Técnica

Se ha optado por **Docker** como método de instalación principal para cumplir con el criterio de **Portabilidad** exigido en el enunciado, asegurando que el tribunal pueda ejecutar la aplicación sin errores de configuración derivados del software local. 

El uso de **PostgreSQL** sobre otras alternativas se justifica por su robustez en el manejo de tipos de datos complejos y su excelente rendimiento en consultas relacionales. Finalmente, el sistema incluye un proceso de **Seeding** automatizado; esto garantiza que el evaluador disponga de una aplicación con datos funcionales (cursos, tareas, usuarios y configuraciones de marca) desde el primer segundo de la defensa, evitando las "bases de datos vacías" que dificultan la valoración de la interfaz y la experiencia de usuario.