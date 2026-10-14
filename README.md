# Custom Video Player (Reproductor-Online)

> **Language / Idioma:** **English** | [Español](README.es.md)

A lightweight, dependency-free video player built with vanilla HTML, CSS, and JavaScript. Engineered for high compatibility across modern desktop and mobile browsers, as well as Smart TV platforms (Samsung Tizen, LG webOS, NetCast, and legacy WebKit browsers).

Includes a local playlist, custom controls, Smart TV remote and keyboard navigation, repeat modes, buffer indicators, and a clean dark interface.

---

## Features

* **Custom Controls** — Play/Pause, progress bar with buffered indicator, custom volume slider, mute toggle, fullscreen mode, and previous/next track buttons.
* **Smart TV & Remote Control Support** — Full support for remote D-pad spatial navigation, dedicated media keys (Play, Pause, Stop, Rewind, Fast-Forward, Next, Prev), and hardware Back keys (Tizen / webOS).
* **Pseudo-Fullscreen Fallback** — Automatically provides a CSS-based pseudo-fullscreen fallback on devices or browsers where the native Fullscreen API is unsupported or restricted.
* **Repeat Modes** — Flexible playlist looping options:
  * `Off`: Normal sequential playback.
  * `Repeat Current` (`one`): Restarts the active video from the beginning when it ends.
  * `Repeat All` (`all`): Replays the entire playlist upon reaching the end, wrapping from the last video back to the first.
* **Dynamic Playlist & "Now Playing" Title** — Playlist thumbnails and titles are automatically rendered from the `VIDEOS` array, dynamically updating the player header. Failed entries are marked as `Unavailable` and can be reloaded with *Try again*.
* **Autoplay Next** — Optional toggle to automatically advance to the next track when the current video finishes. Only applies when the video is not the last one and the playlist holds more than one item.
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
│   └── style.css     # Legacy-safe styles, dark theme, layout, and control states
├── js/
│   └── js.js         # Player logic: playlist, ES5 compatibility, remote/keyboard navigation
├── videos/           # Your own media files (ignored by git)
├── index.html        # Accessible HTML5 structure and inline SVG icons
├── Dockerfile        # nginx:alpine image for deployment
├── compose.yaml      # Container orchestration, serves on http://localhost:8080
├── LICENSE           # MIT License
├── README.md         # English documentation
└── README.es.md      # Spanish documentation
```

> `videos/` is listed in `.gitignore`, so the media files themselves are never pushed. See [Using Your Own Videos](#using-your-own-videos) below.

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
> python3 -m http.server 8080
>
> # Or using Node.js:
> npx serve .
> ```
>
> Then open <http://localhost:8080>.

---

## Deployment with Docker

A `Dockerfile` and a `compose.yaml` are included, so no local tooling is required beyond Docker.

```bash
docker compose up --build
```

The player is then available on <http://localhost:8080>.

**How it works:**

* The image is based on `nginx:alpine`.
* Only `videos/`, `js/`, `css/`, and `index.html` are copied into `/usr/share/nginx/html/`. Anything else at the repository root is development-only and stays out of the image.
* `compose.yaml` builds from the local context, names the image `videos_ejemplo`, names the container `Web_Video`, and maps port `8080` on the host to port `80` in the container.

> **Important:** `videos/` is ignored by git, so a fresh clone contains no media. Place your `.mp4` files inside `videos/` **before** running `docker compose up --build`; the `COPY ./videos ...` instruction will fail otherwise.

To stop the container:

```bash
docker compose down
```

---

## Using Your Own Videos

The `videos/` folder is intentionally excluded from the repository (see `.gitignore`) so that large media files are never committed. On a fresh clone the folder is empty, so the player will show the error overlay until you provide your own files.

1. Copy your media into the `videos/` folder:

   ```bash
   cp /path/to/my-video.mp4 videos/
   ```

2. Point the `VIDEOS` array at it (see [Adding or Configuring Videos](#adding-or-configuring-videos) below).

**Recommended formats:**

| Use case | Container / Codec | Why |
| --- | --- | --- |
| Smart TVs and legacy browsers | MP4 (H.264 + AAC) | The only combination supported broadly by Tizen, webOS, NetCast, and old WebKit builds |
| Modern desktop and mobile browsers | WebM (VP9/VP8 + Opus) | Smaller files for the same quality |

Use MP4/H.264 if you are unsure, since it plays everywhere this player targets.

---

## Adding or Configuring Videos

Edit the `VIDEOS` catalog array at the beginning of [`js/js.js`](js/js.js):

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

> If the playlist contains only one video, the *Previous* and *Next* buttons and the *Autoplay next* toggle are hidden automatically, since there is nothing to switch to.

### Player Settings (`PLAYER_SETTINGS`)

Default repeat behaviors and loop button visibility can be tuned in [`js/js.js`](js/js.js):

```javascript
var PLAYER_SETTINGS = {
  loopMode: 'all',                       // Initial mode: 'off' | 'one' | 'all'
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

Previous and Next **wrap around at both ends** of the playlist, so *Previous* on the first video jumps to the last one.

### Notes on Shortcut Behaviour

* Shortcuts are ignored whenever `Ctrl`, `Alt`, or `Cmd` is held down, so browser and OS shortcuts keep working.
* `Space` is passed through to the focused element when a `<button>` or `<input>` has focus, letting the native click behaviour run.
* `Esc` only reaches the player while in **pseudo**-fullscreen. In real fullscreen the browser handles it natively.
* `Back` behaves in three steps: it exits fullscreen first, then returns focus to the player, and on Tizen — when focus is already on the player — it exits the application. Other platforms handle *Back* natively.

### Smart TV Spatial Navigation

* The Up/Down arrows move focus between rows of controls; Left/Right move within a row.
* When moving to another row, the player focuses the element whose horizontal centre is **closest** to the currently focused one, so navigation follows the on-screen layout instead of a fixed index.
* Playlist cards are grouped into rows by their on-screen position, so a multi-column grid navigates the way it looks.
* On Samsung Tizen, the media keys must be registered explicitly at startup via `tizen.tvinputdevice.registerKey` — the platform only delivers those keys to apps that ask for them.

---

## Mouse & Touch Interaction

| Action | Result |
| --- | --- |
| Click / tap the video surface or the large play button | Toggle play / pause |
| Click / tap the progress bar | Seek to that position |
| Click / tap the volume bar | Set the volume to that level |
| Click / tap a playlist card | Load and play that video |
| Move the mouse over the player | Reveal the (auto-hiding) controls |
| Move the mouse out of the player | Hide the controls again while playing |

---

## Accessibility

* The progress and volume bars are exposed as `role="slider"` with live `aria-valuenow` values, and both are focusable so a remote can operate them.
* The repeat button carries `aria-pressed` reflecting whether any repeat mode is active, plus a descriptive `title`/`aria-label`.
* Every control has an accessible name, and playlist items announce `Now playing` or `Unavailable` through their status text.
* A visible focus ring is drawn for the progress and volume bars so D-pad navigation is trackable on a TV.
* The `<video>` element uses `preload="metadata"` and `playsinline` so iOS and mobile browsers do not hijack playback into fullscreen.
* Icons are inline SVG duplicated per button instead of `<use>`/`<symbol>` sprites, because sprite references are unreliable on older TV engines.

---

## Tech Stack & Compatibility

* **HTML5**: Semantic media markup, inline SVGs for crisp rendering without external assets, and ARIA roles for accessibility.
* **CSS**: Legacy-safe styling using inline-block, positioning, and vendor prefixes (`-webkit-`) to support older WebKit engines without relying on CSS variables, CSS Grid, or modern layout features that break on legacy Smart TVs. The 16:9 player frame and the playlist thumbnails both use the `padding-bottom` percentage technique instead of `aspect-ratio` / `object-fit`.
* **JavaScript (Vanilla ES5)**: Pure ECMAScript 5 code, avoiding ES6+ features (`let`/`const`, arrow functions, Promises, template literals, `classList`) to run natively on Samsung Tizen, LG webOS, and older embedded web runtimes without build tools or polyfills. Class toggling goes through small `addClass`/`removeClass` helpers, and event binding falls back to `attachEvent` when `addEventListener` is missing.

### Compatibility Notes

* Repeat modes are implemented in the `ended` event rather than with the `video.loop` property, because `loop` behaves inconsistently on old TV engines.
* `play()` returns a Promise on modern engines and `undefined` on legacy ones, so the call is wrapped in a helper that tolerates both.
* The UI strings are hardcoded in English in `index.html`; there is no internationalization layer, so translating the interface means editing the markup directly.
* There are no linters, formatters, or test runners. Verify changes manually by exercising playback, seeking, volume, repeat modes, fullscreen, and the TV remote keys.

---

## License

MIT License — see [LICENSE](LICENSE).

Copyright (c) 2026 fonta81