# 02. Descripción del Proyecto

## Índice
1. [Descripción detallada de funcionalidades](#1-descripción-detallada-de-funcionalidades)
    * [1.1 Usuario Invitado (Captación y Accesibilidad)](#11-usuario-invitado-captación-y-accesibilidad)
    * [1.2 Usuario Alumno (Aula Virtual)](#12-usuario-alumno-aula-virtual)
    * [1.3 Usuario Docente (Gestión Académica)](#13-usuario-docente-gestión-académica)
    * [1.4 Usuario Administrador (Control Total y White Label)](#14-usuario-administrador-control-total-y-white-label)
2. [Interfaz (UI) y Experiencia de Usuario (UX)](#2-interfaz-ui-y-experiencia-de-usuario-ux)
3. [Usuarios Objetivo y Casos de Uso](#3-usuarios-objetivo-y-casos-de-uso)

---

## 1. Descripción detallada de funcionalidades

OpenClassy está diseñado para cubrir el ciclo completo de una academia de idiomas: desde que un usuario anónimo llega a la web hasta que un alumno recibe su certificación final.

### 1.1 Usuario Invitado (Captación y Accesibilidad)
El foco principal es la conversión de visitantes en alumnos potenciales (leads).
*   **Calculadora de Presupuestos:** Permite obtener un coste estimado según el curso y duración, con un sistema de recomendación inteligente que invita a realizar la prueba de nivel.
*   **Prueba de Nivel con IA:** Redacción evaluada en tiempo real. El usuario recibe el resultado y puede elegir recibir un informe detallado por email. El sistema sugiere cursos acordes al nivel obtenido.
*   **Catálogo de Cursos y Bonos:** Visualización de la oferta académica y modalidades de pago/bonos disponibles.
*   **Información de Exámenes:** Sección informativa sobre certificaciones oficiales (Cambridge, DELE, etc.).
*   **Toolbar de Accesibilidad:** Control flotante que permite activar el **Modo Dislexia** (tipografía OpenDyslexic) y **Modo Daltónico** (filtros de contraste adaptados) en toda la web pública.
*   **Formulario de Contacto:** Validación avanzada de datos con almacenamiento en base de datos para seguimiento comercial.

### 1.2 Usuario Alumno (Aula Virtual)
Espacio personal centrado en el seguimiento del aprendizaje.
*   **Gestión de Tareas:** Listado de tareas activas con fecha/hora límite y sistema de subida de archivos para entregas.
*   **Repositorio de Documentos:** Descarga de materiales didácticos publicados por el docente.
*   **Calendario Académico:** Visualización de eventos, exámenes y festivos específicos de su curso.
*   **Sala de Clase:** Acceso directo a sesiones de videollamada (Meet/Zoom) mediante enlaces dinámicos.
*   **Notificaciones y Mensajería:** Sistema de avisos sobre novedades del curso y chat interno con su profesor.
*   **Calificaciones y Exportación:** Consulta de notas por tarea y nota global, con funcionalidad de **exportación a PDF** para informes oficiales.
*   **Ajustes de Accesibilidad Persistentes:** Configuración de su perfil para que la interfaz se adapte siempre a sus necesidades visuales (Daltónico/Dislexia).

### 1.3 Usuario Docente (Gestión Académica)
Herramientas para el control de grupos y evaluación.
*   **Gestión de Contenidos:** Capacidad para subir y organizar enlaces, vídeos, documentos e imágenes por curso.
*   **Evaluación 360º:** Creación de tareas, corrección con comentarios personalizados y asignación de calificaciones globales por alumno.
*   **Comunicación Multicanal:** Recepción de dudas y envío de mensajes individuales o masivos a todo un grupo.
*   **Gestión Multicurso:** Un docente puede estar asignado y gestionar varios cursos de forma simultánea.
*   **Control de Aula Virtual:** Gestión del enlace a la "Sala de clase" para las sesiones en vivo.

### 1.4 Usuario Administrador (Control Total y White Label)
Gestión estructural y analítica de la plataforma.
*   **Gestión de Usuarios y Roles:** CRUD completo de perfiles y asignación de permisos (Admin, Docente, Alumno).
*   **Estructura Académica:** Creación y borrado de cursos y bonos; vinculación de alumnos y docentes a grupos.
*   **Theming Engine:** Selector de temas y variantes estéticas para la web y el aula virtual. Inyección dinámica de identidad corporativa.
*   **Métricas de Captación:** Panel de seguimiento de usuarios que han realizado la prueba de nivel para facilitar su conversión a alumnos matriculados.

---

## 2. Interfaz (UI) y Experiencia de Usuario (UX)

La plataforma se basa en una filosofía de **diseño inclusivo y reactivo**.

*   **Accesibilidad Proactiva (DIW RA5, RA6):** A diferencia de otras plataformas, OpenClassy integra la accesibilidad en el núcleo. El uso de la tipografía para disléxicos y modos para daltónicos no es solo estético, sino que modifica el DOM para asegurar la legibilidad.
*   **Experiencia Single Page (DWEC):** La transición entre el calendario, la mensajería y las tareas es instantánea, eliminando la frustración de las recargas de página de los LMS tradicionales.
*   **Mobile First:** Todas las tablas de calificaciones, formularios de entrega y chats han sido optimizados para su uso con una sola mano en dispositivos móviles.
*   **White Label dinámico:** El sistema recupera la configuración de la base de datos (colores, fuentes, logos) y aplica los estilos mediante variables CSS (`root variables`) antes de que el usuario vea la primera carga.

---

## 3. Usuarios Objetivo y Casos de Uso

| Actor | Caso de Uso | Descripción |
| :--- | :--- | :--- |
| **Invitado** | Calcular presupuesto y realizar test | Calcula su coste, hace el test de IA y recibe los resultados por email para formalizar la matrícula. |
| **Invitado** | Usar Toolbar Accesibilidad | Activa el modo para daltónicos para poder distinguir correctamente los niveles del catálogo de cursos. |
| **Alumno** | Consultar notas y exportar PDF | Revisa sus calificaciones finales y genera un PDF para justificar su progreso. |
| **Docente** | Calificar y comentar tarea | Revisa la entrega de un alumno, le pone una nota y le deja un comentario con feedback para mejorar. |
| **Docente** | Gestionar Sala de Clase | Actualiza el enlace de Zoom para la clase de refuerzo de los viernes. |
| **Admin** | Analizar métricas de Test | Revisa el listado de personas que sacaron un nivel B2 en el test de IA para ofrecerles un curso intensivo. |