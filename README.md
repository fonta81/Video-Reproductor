# Custom Video Player (Reproductor-Online)

A lightweight, dependency-free video player built with vanilla HTML, CSS, and JavaScript. Engineered for high compatibility across modern desktop and mobile browsers, as well as Smart TV platforms (Samsung Tizen, LG webOS, NetCast, and legacy WebKit browsers).

Includes a local playlist, custom controls, Smart TV remote and keyboard navigation, repeat modes, buffer indicators, and a clean dark interface.

---

## Features

* **Custom Controls** — Play/Pause, progress bar with buffered indicator, custom volume slider, mute toggle, fullscreen mode, and previous/next track buttons.
* **Smart TV & Remote Control Support** — Full support for remote D-pad spatial navigation, dedicated media keys (Play, Pause, Stop, Rewind, Fast-Forward, Next, Prev), and hardware Back keys (Tizen / webOS).
* **Pseudo-Fullscreen Fallback** — Automatically provides a CSS-based pseudo-fullscreen fallback on devices or browsers where the native Fullscreen API is unsupported or restricted.
* **Repeat Modes** — Flexible playlist looping options:
  * `Off`: Normal sequential playback.
  * `Repeat Current` (`one`): Continuously loops the active video.
  * `Repeat All` (`all`): Replays the entire playlist upon reaching the end.
* **Dynamic Playlist & "Now Playing" Title** — Playlist thumbnails and titles are automatically rendered from the `VIDEOS` array, dynamically updating the player header.
* **Autoplay Next** — Optional toggle to automatically advance to the next track when the current video finishes.
* **Loading & Buffering Indicator** — Visual spinner feedback while video content is buffering or loading.
* **Error Handling & Retry** — Displays user-friendly error overlay with a "Try again" action if a media stream fails to load.
* **Auto-Hide Controls** — Controls automatically fade out after 3 seconds of inactivity during playback.
* **Legacy-Safe Architecture** — Built with ES5 JavaScript and legacy-compatible CSS (avoids CSS variables, Grid, or unsupported modern APIs) for seamless execution on older TV chipsets and embedded browsers.
* **Responsive Layout** — Preserves standard 16:9 aspect ratio and adapts smoothly across mobile devices, desktop monitors, and widescreen displays.

---

## Project Structure

```
Video-Reproductor/
├── css/
│   └── style.css   # Legacy-safe styles, dark theme, layout, and control states
├── js/
│   └── js.js       # Player logic: playlist, ES5 compatibility, remote/keyboard navigation
├── index.html      # Accessible HTML5 structure and inline SVG icons
├── LICENSE         # MIT License
└── README.md       # Project documentation
```

---

## Getting Started

Because the player is self-contained with no build steps or dependencies, you can launch `index.html` directly in your browser:

```bash
# Open index.html directly:
xdg-open index.html   # Linux
open index.html       # macOS
start index.html      # Windows
```

> **Note:** When using local video paths, some browsers apply strict security restrictions on the `file://` protocol. If media fails to load, run a lightweight local HTTP server:
>
> ```bash
> # Using Python:
> python3 -m http.server
>
> # Or using Node.js:
> npx serve .
> ```

---

## Adding or Configuring Videos

Edit the `VIDEOS` catalog array at the beginning of [`js/js.js`](file:///home/mteo/Documentos/proyectos_personales/PaginaWeb/Video-Reproductor/js/js.js):

```javascript
var VIDEOS = [
  {
    title: 'Video Title',                  // Required: Displayed in header and playlist
    src: './videos/sample.mp4',           // Required: Relative/absolute path or remote URL
    poster: 'https://example.com/img.jpg' // Optional: Thumbnail poster image
  },
  // Add additional video objects as needed...
];
```

### Player Settings (`PLAYER_SETTINGS`)

Default repeat behaviors and loop button visibility can be tuned in [`js/js.js`](file:///home/mteo/Documentos/proyectos_personales/PaginaWeb/Video-Reproductor/js/js.js):

```javascript
var PLAYER_SETTINGS = {
  loopMode: 'off',                       // Initial mode: 'off' | 'one' | 'all'
  loopModes: ['off', 'one', 'all'],      // Cycling order for toggle
  showLoopButton: true                   // Set to false to hide the repeat button UI
};
```

---

## Keyboard & Remote Control Shortcuts

The player supports standard keyboard inputs as well as dedicated Smart TV remote control keycodes:

| Key / Remote Button | Action |
| --- | --- |
| `Space` / `K` / `Media Play/Pause` / `Enter` (on player) | Play / Pause |
| `Media Play` | Play |
| `Media Pause` | Pause |
| `Media Stop` | Stop video and reset playback to beginning |
| `M` / `Enter` (on volume slider) | Toggle Mute |
| `F` | Toggle Fullscreen (or pseudo-fullscreen fallback) |
| `N` / `Remote Next` | Next Video |
| `P` / `Remote Prev` | Previous Video |
| `L` | Cycle Repeat Mode (`Off` &rarr; `Current` &rarr; `All`) |
| `<-` / `->` (Left / Right Arrow) | Seek backward / forward 5 seconds *(or adjust volume when volume bar is focused)* |
| `Media Rewind` / `Media Fast-Forward` | Seek backward / forward 10 seconds |
| `Up` / `Down` Arrow | Navigate focus between player controls and playlist items |
| `Enter` | Activate selected button / control |
| `Esc` / `Back` (Tizen / webOS) | Exit fullscreen mode / return focus |

> *Keyboard shortcuts are suppressed while typing inside input fields.*

---

## Tech Stack & Compatibility

* **HTML5**: Semantic media markup, inline SVGs for crisp rendering without external assets, and ARIA roles for accessibility.
* **CSS**: Legacy-safe styling using inline-block, positioning, and vendor prefixes (`-webkit-`) to support older WebKit engines without relying on CSS variables, CSS Grid, or modern layout features that break on legacy Smart TVs.
* **JavaScript (Vanilla ES5)**: Pure ECMAScript 5 code, avoiding ES6+ features (`let`/`const`, arrow functions, Promises, template literals, `classList`) to run natively on Samsung Tizen, LG webOS, and older embedded web runtimes without build tools or polyfills.
