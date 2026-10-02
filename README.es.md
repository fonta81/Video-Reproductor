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
  * `Repeat Current` (`one`): Repite el video actual indefinidamente.
  * `Repeat All` (`all`): Vuelve a iniciar la lista de reproducción al finalizar el último video.
* **Lista de reproducción dinámica y título actual** — Las miniaturas y títulos se generan dinámicamente desde el arreglo `VIDEOS`, actualizando en tiempo real la cabecera del reproductor.
* **Reproducción automática del siguiente video (Autoplay next)** — Interruptor opcional para pasar automáticamente al siguiente video cuando termina el actual.
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
│   └── style.css    # Estilos compatibles con Smart TV, tema oscuro y estados de control
├── js/
│   └── js.js        # Lógica del reproductor: lista, compatibilidad ES5 y navegación
├── index.html       # Estructura HTML5 accesible e iconos SVG en línea
├── LICENSE          # Licencia MIT
├── README.md        # Documentación en inglés
└── README.es.md     # Documentación en español
```

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
> python3 -m http.server
>
> # O usando Node.js:
> npx serve .
> ```

---

## Agregar o Configurar Videos

Edita el arreglo `VIDEOS` al inicio del archivo [`js/js.js`](file:///home/mteo/Documentos/proyectos_personales/PaginaWeb/Video-Reproductor/js/js.js):

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

### Configuración del Reproductor (`PLAYER_SETTINGS`)

Puedes ajustar el comportamiento de repetición inicial y la visibilidad del botón de bucle en [`js/js.js`](file:///home/mteo/Documentos/proyectos_personales/PaginaWeb/Video-Reproductor/js/js.js):

```javascript
var PLAYER_SETTINGS = {
  loopMode: 'off',                       // Modo inicial: 'off' | 'one' | 'all'
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

> *Los atajos de teclado se desactivan automáticamente al escribir dentro de campos de texto o inputs.*

---

## Tecnologías y Compatibilidad

* **HTML5**: Marcado semántico para medios, SVGs integrados en línea para una representación nítida sin peticiones adicionales y atributos ARIA para accesibilidad.
* **CSS**: Estilos seguros para televisores antiguos mediante posicionamiento, visualización inline-block y prefijos de compatibilidad (`-webkit-`), evitando variables CSS o CSS Grid que fallan en navegadores embebidos antiguos.
* **JavaScript (Vanilla ES5)**: Código puro en ECMAScript 5 sin características de ES6+ (`let`/`const`, funciones flecha, Promesas, template literals ni `classList`) para ejecutarse de forma nativa en Samsung Tizen, LG webOS y otros entornos antiguos sin necesidad de transpiladores ni polyfills pesados.
