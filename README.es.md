# Reproductor de Video Personalizado (Reproductor-Online)

> **Idioma / Language:** [English](README.md) | **Español**

Un reproductor de video ligero y sin dependencias externas, construido con HTML, CSS y JavaScript vanilla. Diseñado para ofrecer una alta compatibilidad tanto en navegadores modernos (escritorio y móviles) como en plataformas de Smart TV (Samsung Tizen, LG webOS, NetCast y motores WebKit antiguos).

Incluye lista de reproducción local, controles personalizados, navegación mediante teclado y mando a distancia para Smart TV, modos de repetición, indicadores de carga/búfer y una interfaz oscura limpia.

---

## Características

* **Controles personalizados** — Reproducir/Pausa, barra de progreso con indicador de búfer, control deslizante de volumen a medida, silenciar (mute), modo pantalla completa y botones de video anterior/siguiente.
* **Soporte para Smart TV y mandos a distancia** — Navegación espacial con cruceta D-pad, teclas multimedia dedicadas (Play, Pause, Stop, Rewind, Fast-Forward, Next, Prev) y tecla física de retroceso/Back (Tizen / webOS).
* **Modo pseudo-pantalla completa (Fallback)** — Proporciona automáticamente una pantalla completa basada en CSS en dispositivos o navegadores donde la API nativa de Fullscreen no esté disponible o esté restringida.
* **Modos de repetición** — Opciones flexibles para el bucle de reproducción:
  * `Off`: Reproducción secuencial estándar.
  * `Repeat Current` (`one`): Reinicia el video actual desde el principio cuando termina.
  * `Repeat All` (`all`): Vuelve a iniciar la lista de reproducción al finalizar el último video, pasando del último al primero.
* **Lista de reproducción dinámica y título actual** — Las miniaturas y títulos se generan dinámicamente desde el arreglo `VIDEOS`, actualizando en tiempo real la cabecera del reproductor. Las entradas que fallan se marcan como `Unavailable` y pueden recargarse con el botón "Try again".
* **Reproducción automática del siguiente video (Autoplay next)** — Interruptor opcional para pasar automáticamente al siguiente video cuando termina el actual. Solo se aplica si el video no es el último y la lista contiene más de un elemento.
* **Indicador de carga y búfer** — Spinner visual mientras se carga o almacena en búfer el contenido del video.
* **Manejo de errores y reintento** — Muestra un mensaje claro con botón "Try again" si un archivo de video no puede cargarse.
* **Ocultación automática de controles** — Los controles se desvanecen automáticamente tras 3 segundos de inactividad durante la reproducción.
* **Arquitectura segura para televisores antiguos (Legacy-safe)** — Desarrollado en JavaScript ES5 y CSS compatible con motores antiguos (sin variables CSS, CSS Grid o APIs modernas incompatibles), garantizando un funcionamiento fluido en chipsets antiguos de Smart TV.
* **Diseño responsivo** — Mantiene la relación de aspecto 16:9 y se adapta fluidamente a dispositivos móviles, pantallas de escritorio y monitores panorámicos.

---

## Estructura del Proyecto

```
Video-Reproductor/
├── css/
│   └── style.css     # Estilos compatibles con Smart TV, tema oscuro y estados de control
├── js/
│   └── js.js         # Lógica del reproductor: lista, compatibilidad ES5 y navegación
├── videos/           # Tus propios archivos multimedia (ignorado por git)
├── index.html        # Estructura HTML5 accesible e iconos SVG en línea
├── Dockerfile        # Imagen nginx:alpine para el despliegue
├── compose.yaml      # Orquestación de contenedores, sirve en http://localhost:8080
├── LICENSE           # Licencia MIT
├── README.md         # Documentación en inglés
└── README.es.md      # Documentación en español
```

> La carpeta `videos/` figura en `.gitignore`, por lo que los archivos multimedia nunca se suben al repositorio. Consulta [Usar tus propios videos](#usar-tus-propios-videos) más abajo.

---

## Primeros Pasos

Dado que el reproductor es completamente autónomo y no requiere compilación ni dependencias, puedes abrir `index.html` directamente en tu navegador:

```bash
# Abrir index.html directamente:
xdg-open index.html   # Linux
open index.html       # macOS
start index.html      # Windows
```

> **Nota:** Al usar rutas de video locales, algunos navegadores aplican restricciones de seguridad estrictas sobre el protocolo `file://`. Si los videos no cargan, inicia un servidor HTTP local básico:
>
> ```bash
> # Usando Python:
> python3 -m http.server 8080
>
> # O usando Node.js:
> npx serve .
> ```
>
> Después abre <http://localhost:8080>.

---

## Despliegue con Docker

Se incluyen un `Dockerfile` y un `compose.yaml`, así que no necesitas más herramientas locales que Docker.

```bash
docker compose up --build
```

El reproductor queda disponible en <http://localhost:8080>.

**Cómo funciona:**

* La imagen se basa en `nginx:alpine`.
* Solo se copian `videos/`, `js/`, `css/` e `index.html` a `/usr/share/nginx/html/`. Cualquier otro elemento en la raíz del repositorio es solo de desarrollo y queda fuera de la imagen.
* `compose.yaml` construye desde el contexto local, nombra la imagen `videos_ejemplo`, nombra el contenedor `Web_Video` y mapea el puerto `8080` del host al puerto `80` del contenedor.

> **Importante:** `videos/` está ignorada por git, así que un clon nuevo no incluye medios. Coloca tus archivos `.mp4` dentro de `videos/` **antes** de ejecutar `docker compose up --build`; de lo contrario, la instrucción `COPY ./videos ...` fallará.

Para detener el contenedor:

```bash
docker compose down
```

---

## Usar tus Propios Videos

La carpeta `videos/` está excluida del repositorio a propósito (ver `.gitignore`) para que los archivos multimedia de gran tamaño nunca se commiten. En un clon nuevo la carpeta está vacía, por lo que el reproductor mostrará la pantalla de error hasta que proporciones tus propios archivos.

1. Copia tus archivos multimedia en la carpeta `videos/`:

   ```bash
   cp /ruta/a/mi-video.mp4 videos/
   ```

2. Indica la ruta en el arreglo `VIDEOS` (consulta [Agregar o Configurar Videos](#agregar-o-configurar-videos) más abajo).

**Formatos recomendados:**

| Caso de uso | Contenedor / Códec | Motivo |
| --- | --- | --- |
| Smart TVs y navegadores antiguos | MP4 (H.264 + AAC) | La única combinación soportada de forma amplia por Tizen, webOS, NetCast y motores WebKit antiguos |
| Navegadores modernos de escritorio y móvil | WebM (VP9/VP8 + Opus) | Archivos más pequeños para la misma calidad |

Usa MP4/H.264 si tienes dudas, ya que reproduce en todos los destinos de este reproductor.

---

## Agregar o Configurar Videos

Edita el arreglo `VIDEOS` al inicio del archivo [`js/js.js`](js/js.js):

```javascript
var VIDEOS = [
  {
    title: 'Título del Video',            // Requerido: Nombre visible en la lista y cabecera
    src: './videos/ejemplo.mp4',          // Requerido: Ruta local o URL remota
    poster: 'https://ejemplo.com/img.jpg' // Opcional: Imagen de miniatura
  },
  // Agrega más objetos de video según sea necesario...
];
```

> Si la lista contiene un solo video, los botones *Anterior* y *Siguiente* y el interruptor de *Autoplay next* se ocultan automáticamente, ya que no hay nada a lo que cambiar.

### Configuración del Reproductor (`PLAYER_SETTINGS`)

Puedes ajustar el comportamiento de repetición inicial y la visibilidad del botón de bucle en [`js/js.js`](js/js.js):

```javascript
var PLAYER_SETTINGS = {
  loopMode: 'all',                       // Modo inicial: 'off' | 'one' | 'all'
  loopModes: ['off', 'one', 'all'],      // Orden de los modos al alternar
  showLoopButton: true                   // Cambia a false para ocultar el botón en la interfaz
};
```

---

## Atajos de Teclado y Mando a Distancia

El reproductor admite tanto atajos de teclado estándar como códigos de teclas de mandos a distancia para Smart TV:

| Tecla / Botón del Mando | Acción |
| --- | --- |
| `Espacio` / `K` / `Media Play/Pause` / `Enter` (en el reproductor) | Reproducir / Pausar |
| `Media Play` | Reproducir |
| `Media Pause` | Pausar |
| `Media Stop` | Detener video y reiniciar la reproducción al inicio |
| `M` / `Enter` (en la barra de volumen) | Silenciar / Activar sonido (Mute) |
| `F` | Alternar pantalla completa (o fallback pseudo-fullscreen) |
| `N` / `Remote Next` | Siguiente video |
| `P` / `Remote Prev` | Video anterior |
| `L` | Alternar modo de repetición (`Off` &rarr; `Current` &rarr; `All`) |
| `<-` / `->` (Flechas Izq / Der) | Retroceder / Avanzar 5 segundos *(o regular volumen si la barra tiene foco)* |
| `Media Rewind` / `Media Fast-Forward` | Retroceder / Avanzar 10 segundos |
| Flechas `Arriba` / `Abajo` | Mover el foco entre controles y elementos de la lista |
| `Enter` | Activar el botón o control seleccionado |
| `Esc` / `Back` (Tizen / webOS) | Salir de pantalla completa / volver atrás |

*Anterior* y *Siguiente* **dan la vuelta en ambos extremos** de la lista, por lo que *Anterior* sobre el primer video salta al último.

### Notas sobre el Comportamiento de los Atajos

* Los atajos se ignoran siempre que se mantenga pulsado `Ctrl`, `Alt` o `Cmd`, de modo que los atajos del navegador y del sistema sigan funcionando.
* `Espacio` se delega en el elemento enfocado cuando hay un `<button>` o `<input>` con el foco, permitiendo que se ejecute el comportamiento nativo de clic.
* `Esc` solo llega al reproductor en modo **pseudo**-pantalla completa. En pantalla completa real lo gestiona el navegador de forma nativa.
* `Back` actúa en tres pasos: primero sale de la pantalla completa, después devuelve el foco al reproductor y, en Tizen —cuando el foco ya está en el reproductor—, cierra la aplicación. El resto de plataformas gestiona `Back` de forma nativa.

### Navegación Espacial en Smart TV

* Las flechas Arriba/Abajo mueven el foco entre filas de controles; Izquierda/Derecha se mueven dentro de una misma fila.
* Al pasar a otra fila, el reproductor enfoca el elemento cuyo centro horizontal esté **más cerca** del elemento enfocado actualmente, de modo que la navegación sigue la disposición en pantalla en lugar de un índice fijo.
* Las tarjetas de la lista se agrupan en filas según su posición en pantalla, de modo que una cuadrícula de varias columnas se navega tal y como se ve.
* En Samsung Tizen, las teclas multimedia deben registrarse explícitamente al arrancar mediante `tizen.tvinputdevice.registerKey`, ya que la plataforma solo entrega esas teclas a las apps que las solicitan.

---

## Interacción con Ratón y Táctil

| Acción | Resultado |
| --- | --- |
| Clic / toque sobre el vídeo o el botón grande | Alternar reproducir / pausar |
| Clic / toque en la barra de progreso | Buscar hasta esa posición |
| Clic / toque en la barra de volumen | Ajustar el volumen a ese nivel |
| Clic / toque en una tarjeta de la lista | Cargar y reproducir ese video |
| Mover el ratón sobre el reproductor | Mostrar los controles (se ocultan solos) |
| Sacar el ratón del reproductor | Volver a ocultar los controles durante la reproducción |

---

## Accesibilidad

* Las barras de progreso y de volumen se exponen como `role="slider"` con valores `aria-valuenow` dinámicos, y ambas son enfocables para poder operarlas con el mando.
* El botón de repetición incorpora `aria-pressed` para reflejar si hay algún modo de repetición activo, además de un `title`/`aria-label` descriptivo.
* Todos los controles tienen un nombre accesible, y los elementos de la lista anuncian `Now playing` o `Unavailable` mediante su texto de estado.
* Se dibuja un anillo de foco visible en las barras de progreso y volumen, para que la navegación con D-pad sea fácil de seguir en un televisor.
* El elemento `<video>` usa `preload="metadata"` y `playsinline`, de modo que iOS y los navegadores móviles no fuerzan la reproducción a pantalla completa.
* Los iconos son SVG en línea duplicados por botón en lugar de sprites `<use>`/`<symbol>`, porque las referencias a sprites no son fiables en motores antiguos de Smart TV.

---

## Tecnologías y Compatibilidad

* **HTML5**: Marcado semántico para medios, SVGs integrados en línea para una representación nítida sin peticiones adicionales y atributos ARIA para accesibilidad.
* **CSS**: Estilos seguros para televisores antiguos mediante posicionamiento, visualización inline-block y prefijos de compatibilidad (`-webkit-`), evitando variables CSS o CSS Grid que fallan en navegadores embebidos antiguos. Tanto el marco 16:9 del reproductor como las miniaturas de la lista usan la técnica del porcentaje en `padding-bottom` en lugar de `aspect-ratio` u `object-fit`.
* **JavaScript (Vanilla ES5)**: Código puro en ECMAScript 5 sin características de ES6+ (`let`/`const`, funciones flecha, Promesas, template literals ni `classList`) para ejecutarse de forma nativa en Samsung Tizen, LG webOS y otros entornos antiguos sin necesidad de transpiladores ni polyfills pesados. La manipulación de clases se realiza con pequeños helpers `addClass`/`removeClass`, y el registro de eventos recurre a `attachEvent` cuando `addEventListener` no existe.

### Notas de Compatibilidad

* Los modos de repetición se implementan en el evento `ended` y no con la propiedad `video.loop`, porque `loop` se comporta de forma inconsistente en motores antiguos de Smart TV.
* `play()` devuelve una Promesa en los motores modernos y `undefined` en los antiguos, por lo que la llamada se envuelve en un helper que tolera ambos casos.
* Los textos de la interfaz están escritos en inglés directamente en `index.html`; no existe capa de internacionalización, así que traducir la interfaz implica editar el marcado directamente.
* No hay linters, formateadores ni runners de pruebas. Verifica los cambios manualmente ejercitando reproducción, búsqueda, volumen, modos de repetición, pantalla completa y las teclas del mando de TV.

---

## Licencia

Licencia MIT — consulta [LICENSE](LICENSE).

Copyright (c) 2026 fonta81