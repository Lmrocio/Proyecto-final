# 09. Manual de Usuario

## 1. Introducción

OpenClassy es una plataforma académica orientada a la gestión de cursos de inglés, seguimiento del alumnado y personalización visual de la academia. La aplicación se divide en una zona pública y un área autenticada con comportamiento distinto según el rol del usuario.

---

## 2. Acceso inicial

### Zona pública

Sin iniciar sesión, cualquier visitante puede:

*   Consultar la configuración visual cargada por la academia.
*   Realizar la prueba de nivel escrita asistida por IA.

### Inicio de sesión

Desde la pantalla de acceso, el usuario debe introducir su correo y contraseña. Si las credenciales son válidas, el sistema devuelve un token y carga la interfaz correspondiente a su rol.

Si las credenciales no son correctas, la API responde con el mensaje `Invalid credentials.`.

---

## 3. Prueba de nivel escrita

La prueba de nivel permite introducir:

*   Un tema o enunciado de redacción.
*   Un texto redactado en inglés por el estudiante.

Al enviarla, el sistema analiza la composición y devuelve:

*   Nivel MCER sugerido.
*   Puntuación total.
*   Subpuntuaciones por criterio.
*   Fortalezas detectadas.
*   Aspectos de mejora.
*   Recomendación para progresar al siguiente nivel.

Esta funcionalidad está pensada como apoyo al diagnóstico inicial y no sustituye la valoración docente.

---

## 4. Funcionalidades por rol

### 4.1 Administrador

El administrador dispone del mayor nivel de control sobre la plataforma. Puede:

*   Crear, consultar, editar y eliminar usuarios.
*   Crear y gestionar cursos.
*   Gestionar matrículas y bonos.
*   Modificar la variante visual del sitio desde la configuración administrativa.

Restricción importante: el administrador no puede eliminar su propia cuenta desde la API, evitando un bloqueo accidental del sistema.

### 4.2 Profesor

El profesor puede trabajar sobre los cursos que tiene asignados. Entre sus acciones principales se incluyen:

*   Consultar sus cursos.
*   Registrar asistencia.
*   Publicar materiales.
*   Corregir o calificar entregas del alumnado.

### 4.3 Alumno

El alumno accede únicamente a la información para la que tiene matrícula activa. Puede:

*   Ver sus cursos disponibles.
*   Consultar tareas asignadas.
*   Enviar entregas de trabajos.
*   Revisar materiales y contenidos asociados a su curso.

---

## 5. Flujo básico de uso

1. El usuario entra en la web.
2. Si no tiene sesión, puede probar la evaluación escrita pública.
3. Si inicia sesión, la SPA recupera el usuario autenticado.
4. El sistema carga paneles, cursos y opciones en función del rol.
5. Cada acción sensible se valida también en backend para impedir accesos indebidos.

---

## 6. Recomendaciones de uso durante la defensa

*   Cargar previamente datos de demostración para mostrar flujos completos.
*   Tener preparado al menos un usuario por rol.
*   Verificar antes de la presentación que la API responde en `http://localhost:8000` y la SPA en `http://localhost:5173`.

---

## 7. Resolución de incidencias frecuentes

| Incidencia | Comprobación recomendada |
| :--- | :--- |
| No aparece información al entrar en la SPA | Verificar que backend y frontend están levantados y que `VITE_API_URL` apunta al backend correcto. |
| No se puede iniciar sesión | Revisar credenciales, semilla de usuarios y disponibilidad de la API. |
| La prueba de nivel no devuelve resultado | Comprobar conectividad con OpenRouter o usar doble de prueba en entorno de test. |
| Los cursos no aparecen para un alumno | Confirmar que existe una matrícula activa en el curso correspondiente. |

Este manual cubre el uso funcional básico del sistema para la defensa y la demostración operativa del proyecto.

