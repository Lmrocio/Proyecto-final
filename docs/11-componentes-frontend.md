# 11. Componentes Frontend (Login y Config)

## ConfigProvider

| Prop | Tipo | Requerido | Descripcion |
| :--- | :--- | :--- | :--- |
| children | ReactNode | Si | Arbol de UI que necesita la configuracion global. |

Accesibilidad: aplica variables de color en `:root` para mantener contraste y tema coherente en todas las vistas.

## Login

| Prop | Tipo | Requerido | Descripcion |
| :--- | :--- | :--- | :--- |
| (sin props) | - | - | Pagina de login con layout dinamico. |

Accesibilidad: usa `main`, `header`, `footer`, enlaces con etiquetas claras y fallback de error con accion de reintento.

## LoginForm

| Prop | Tipo | Requerido | Descripcion |
| :--- | :--- | :--- | :--- |
| onSuccess | function | No | Callback ejecutado tras login correcto. |

Accesibilidad: labels asociados a inputs, `aria-invalid`, mensajes con `role=alert`, y `aria-busy` durante carga.

## AdminSettings

| Prop | Tipo | Requerido | Descripcion |
| :--- | :--- | :--- | :--- |
| (sin props) | - | - | Panel de configuracion visual para admin. |

Accesibilidad: botones con `aria-pressed`, estados anunciados con `aria-live` y mensajes de estado con roles adecuados.

## EmptyState

| Prop | Tipo | Requerido | Descripcion |
| :--- | :--- | :--- | :--- |
| title | string | Si | Titulo del estado vacio o error. |
| text | string | Si | Mensaje de contexto para el usuario. |
| actionLabel | string | No | Texto del boton de accion. |
| onAction | function | No | Handler de la accion principal. |
| tone | string | No | Modula el estilo y rol del mensaje (default, error u ok). |

Accesibilidad: el contenedor usa `role=status` o `role=alert` segun el tono, y el boton es accesible por teclado.
