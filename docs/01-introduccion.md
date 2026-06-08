# 01. Introducción, Objetivos y Antecedentes

## Índice
1. [Origen de la idea y motivación](#1-origen-de-la-idea-y-motivación)
2. [Expectativas y objetivos específicos](#2-expectativas-y-objetivos-específicos)
    * [2.1 Objetivos Funcionales (MVP)](#21-objetivos-funcionales-mvp)
    * [2.2 Objetivos Técnicos y de Calidad](#22-objetivos-técnicos-y-de-calidad)
3. [Análisis comparativo de aplicaciones similares](#3-análisis-comparativo-de-aplicaciones-similares)

---

## 1. Origen de la idea y motivación

El proyecto **OpenClassy** surge de un análisis detallado del sector educativo, específicamente de las academias de idiomas de tamaño pequeño y mediano en España. A través de la observación directa, se ha detectado que este sector adolece de una digitalización fragmentada y manual. Según el informe *Panorama de la Educación* de la OCDE (2023), el 78% de las más de 20.000 academias registradas en España cuenta con menos de 10 empleados, lo que las sitúa en una posición de vulnerabilidad tecnológica.

La motivación principal del proyecto se divide en tres ejes fundamentales:

1.  **Eliminación de la fragmentación operativa:** Actualmente, estas academias dependen de un ecosistema ineficiente basado en hojas de cálculo, grupos de WhatsApp informales y herramientas genéricas. OpenClassy busca centralizar esta gestión en una única plataforma profesional.
2.  **Resolución del "Cuello de Botella" administrativo:** Las pruebas de nivel iniciales suelen requerir desplazamientos físicos y tiempo del profesorado. La integración de Inteligencia Artificial en este proceso permite automatizar la captación de alumnos 24/7.
3.  **Soberanía de Marca (White Label):** A diferencia de las soluciones SaaS actuales, OpenClassy nace como una herramienta de código abierto que permite a las academias mantener la propiedad de sus datos y personalizar la estética del sitio para que refleje su identidad corporativa, eliminando la dependencia de licencias privativas costosas.

## 2. Expectativas y objetivos específicos

OpenClassy ha sido diseñado no solo como una herramienta de gestión, sino como un producto tecnológico escalable que cumpla con los estándares más exigentes del desarrollo web actual.

### 2.1 Objetivos Funcionales (MVP)
*   **Theming Engine Avanzado:** Implementar un sistema de "Marca Blanca" que permita cambiar colores corporativos, logotipos y tipografías desde un panel de administración, inyectando variables CSS dinámicamente.
*   **Prueba de Nivel con IA:** Integrar modelos de lenguaje (LLM) a través de la API de OpenRouter para evaluar redacciones de alumnos de forma instantánea, devolviendo un nivel MCER (A1-C2) y feedback correctivo.
*   **Aula Virtual Centralizada:** Desarrollar un espacio privado para profesores y alumnos donde se gestionen materiales (PDF/Links), tareas con fechas de entrega y un sistema de mensajería interna.
*   **Herramientas de Captación:** Crear una calculadora de presupuestos interactiva y un catálogo de cursos dinámico que facilite el flujo de inscripción a usuarios anónimos.

### 2.2 Objetivos Técnicos y de Calidad
Para cumplir con las rúbricas de los módulos de **DWES, DWEC y DIW**, el proyecto se marca los siguientes hitos técnicos:
*   **Arquitectura Desacoplada (API + SPA):** Uso de **Laravel 11** para el backend (API RESTful) y **React 18** para el frontend (Single Page Application), garantizando una experiencia de usuario fluida y sin recargas de página.
*   **Código Limpio y SOLID:** Aplicación del patrón *Service Layer* en Laravel para separar la lógica de negocio de los controladores, facilitando el mantenimiento y las pruebas unitarias.
*   **Estética y Accesibilidad (UI/UX):** Aplicación de la metodología **ITCSS** sobre **SASS** para una gestión profesional de los estilos, garantizando un diseño **Mobile First** y el cumplimiento de las pautas de accesibilidad **WCAG 2.1** (contraste dinámico y navegación semántica).
*   **Contenerización:** Despliegue mediante **Docker Compose**, asegurando que el sistema sea fácilmente replicable e instalable por cualquier academia bajo la filosofía Open Source.

## 3. Análisis comparativo de aplicaciones similares

Para validar la viabilidad de OpenClassy, se ha realizado un análisis de mercado comparándolo con las soluciones más utilizadas en el territorio nacional e internacional:

| Característica | Acadesoft / Englody | Moodle | **OpenClassy** |
| :--- | :--- | :--- | :--- |
| **Modelo** | SaaS Privativo (Cerrado) | Código Abierto | **Código Abierto** |
| **Coste** | Licencia mensual por alumno/mes | Gratuito (pero requiere soporte técnico caro) | **Gratuito (Autoinstalable)** |
| **Marca Blanca** | Muy limitada | Compleja de configurar | **Nativa y visual (Admin Panel)** |
| **Prueba IA** | No disponible | Mediante plugins externos complejos | **Integrada en el Core** |
| **Enfoque** | Administrativo/Contable | Académico puro | **Marketing + Académico + Gestión** |
| **Tecnología** | Monolítica tradicional | PHP Tradicional / Server-side rendering | **Moderna (API REST + React)** |

**Conclusión:** Mientras que las soluciones actuales obligan a las pequeñas academias a elegir entre pagar licencias caras o enfrentarse a la complejidad técnica de Moodle, **OpenClassy** ofrece una alternativa moderna, gratuita y específicamente diseñada para la captación y gestión de centros de idiomas, destacando por su motor de personalización y su uso innovador de la IA.