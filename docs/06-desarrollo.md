Arquitectura de Mensajería Optimizada: Se ha optado por un modelo de tabla dinámica para mensajes con una tabla pivote de destinatarios. Esto permite el envío masivo (Profesor -> Grupo) sin duplicar el cuerpo del mensaje en la base de datos, optimizando el almacenamiento.

Gestión de Asistencia Híbrida: Implementación de una tabla de asistencia que soporta modalidades presenciales y online. El sistema permite el marcado automático para clases online y la edición manual del docente, garantizando integridad en el seguimiento académico.

Theming Engine & Accesibilidad Dinámica: Uso de JSONB en PostgreSQL para almacenar perfiles de accesibilidad (dislexia, daltonismo) y configuraciones de marca blanca. Esto permite la inyección de estilos en tiempo de ejecución (Frontend) sin recargas de página.

Seguridad de Archivos: Implementación de un sistema de gestión de recursos con validación de tipos MIME y límites de tamaño (max 2MB) para prevenir ataques de denegación de servicio y optimizar el almacenamiento del servidor.
