# 04. Guía de Estilos y Prototipado (PRIMERO VERSIÓN)

## Índice
1. [Enlace al prototipo en Figma](#1-enlace-al-prototipo-en-figma)
2. [Guía de estilos](#2-guía-de-estilos)
    * [2.1 Paleta de colores](#21-paleta-de-colores)
    * [2.2 Tipografías](#22-tipografía)
    * [2.3 Sistema de espaciados](#23-sistema-de-espaciados)
3. [Wireframes y Mockups de pantallas principales](#3-wireframes-y-mockups-de-pantallas-principales)
4. [Componentes reutilizables definidos](#4-componentes-reutilizables-definidos)

---

## 1. Enlace al prototipo en Figma

El diseño ha sido realizado siguiendo una metodología de **Atomic Design**. El prototipo es interactivo y simula el flujo real de la aplicación.

*   **Enlace al proyecto:** [FALTA]

---

## 2. Guía de estilos

La guía de estilos se ha diseñado para ser **White Label (Marca Blanca)**. Esto implica que la estructura es fija, pero los estilos visuales son dinámicos.

### 2.1 Paleta de colores


### 2.2 Tipografía
Se han seleccionado fuentes con alta legibilidad para entornos educativos:
*   **Principal**
*   **Accesibilidad (OpenDyslexic):** Fuente opcional que el usuario puede activar para mejorar la lectura si padece dislexia.
*   **Escala tipográfica:** Basada en la unidad `rem` para respetar los ajustes del navegador del usuario.
    *   `h1`: 2.5rem | `h2`: 2rem | `h3`: 1.75rem | `p`: 1rem (16px).

### 2.3 Sistema de espaciados
Se implementa un sistema basado en múltiplos de **8px** para mantener la consistencia rítmica en todo el diseño:
*   `xs`: 4px | `sm`: 8px | `md`: 16px | `lg`: 24px | `xl`: 32px | `xxl`: 48px.
*   Este sistema se aplica tanto a márgenes internos (*padding*) como externos (*margin*) y *gaps* de Flexbox/Grid.

---

## 3. Wireframes y Mockups de pantallas principales

---

## 4. Componentes reutilizables definidos

Para garantizar la consistencia visual Y La eficiencia del código, se han definido los siguientes componentes en React:

*   **Button:** Componente polimórfico con variantes: `primary`, `secondary`, `outline` y `ghost`. Soporta estados de carga (*loading state*).
*   **Card:** Contenedor base con sombras suaves para mostrar cursos o tareas.
*   **Input Group:** Campo de formulario con validación de estados de error y etiquetas flotantes.
*   **Accessibility Toolbar:** Componente flotante para cambiar el tema visual y la tipografía de forma global.
*   **Skeleton Loader:** Componente de carga para mejorar la UX mientras se recuperan datos de la API.
*   **Modal:** Ventana emergente reutilizable para confirmaciones y mensajería.
*   **Notification Toast:** Avisos temporales no intrusivos para confirmar acciones (ej: "Tarea entregada").

---