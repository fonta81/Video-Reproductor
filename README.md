
# Custom Video Player

A lightweight, dependency-free video player built with vanilla HTML, CSS, and JavaScript. Supports a local playlist, custom controls, keyboard shortcuts, repeat modes, and a clean dark UI.

## Features

* **Custom controls** — Play/Pause, progress bar with buffer indicator, volume slider, mute toggle, fullscreen, and previous/next video buttons.

* **Repeat modes (Loop/Repeat)** — Allows switching between:

  * `Off`: Standard playback behavior.

  * `Repeat Current`: Loops the active video indefinitely.

  * `Repeat All`: Loops through the entire playlist and starts over from the beginning.

* **Playlist** — Thumbnail grid automatically generated from the `VIDEOS` array in JavaScript.

* **Autoplay next** — Optional toggle (*Autoplay next*) to automatically advance to the next video when the current one finishes.

* **Loading indicator (Spinner)** — Visual feedback displayed while video content is buffering.

* **Error handling** — Cards are marked as "Unavailable" if a video fails to load, along with a retry option.

* **Auto-hide controls** — Controls automatically fade out after 3 seconds of inactivity during playback.

* **Keyboard shortcuts** — Full accessibility via keyboard inputs.

* **Responsive design** — The UI smoothly adapts to smaller screens (<= 520 px).

## Project Structure

```
Video-Reproductor/
├── css/
│   └── style.css   # Styles, responsive layout, dark theme, and animations
├── js/
│   └── js.js       # Core logic: playlist, controls, shortcuts, and events
├── index.html      # Main HTML layout and playlist markup
├── LICENSE         # MIT License
└── README.md       # Project documentation
```

## Getting Started

Since the player uses local file paths, you can open `index.html` directly in any web browser.

```
# Open index.html directly:
xdg-open index.html   # Linux
open index.html       # macOS
```

> **Note:** Some browsers enforce strict security policies regarding the `file://` protocol. If videos fail to load, serve the repository using a simple local server:
>
> ```
> npx serve .
> # or using Python:
> python3 -m http.server
> ```

## Adding or Removing Videos

Edit the `VIDEOS` array at the top of the [`js/js.js`](js/js.js) file. This is the only place you need to modify to manage your video catalog.

```javascript
const VIDEOS = [
  {
    title: 'Video Title',                  // Required: Name displayed in playlist and header
    src: '/path/to/video.mp4',            // Required: Local path or remote URL
    poster: 'https://example.com/img.jpg' // Optional: Thumbnail image (16:9 ratio recommended)
  },
  // Add more video objects here...
];
```

### Configuration Options (`PLAYER_SETTINGS`)

You can also adjust the default repeat behavior in [`js/js.js`](js/js.js):

```javascript
const PLAYER_SETTINGS = {
  loopMode: 'off',                       // Initial repeat mode: 'off' | 'one' | 'all'
  loopModes: ['off', 'one', 'all'],      // Available repeat options to toggle
  showLoopButton: true,                  // Show or hide the repeat button in controls
};
```

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` / `K` | Play / Pause |
| `M` | Toggle Mute |
| `F` | Toggle Fullscreen |
| `N` | Next Video |
| `P` | Previous Video |
| `L` | Toggle Repeat Mode (`Off` -> `Current` -> `Playlist`) |
| `<-` (Left Arrow) | Seek backward 5 seconds |
| `->` (Right Arrow) | Seek forward 5 seconds |

> *Keyboard shortcuts are automatically disabled while typing inside an input element (`<input>`).*

## Tech Stack

* **HTML5**: Media playback and semantic document structure.

* **CSS3**: Layout design using Flexbox and Grid, animations, and CSS variables.

* **JavaScript (ES6+)**: DOM manipulation, media event handling, and custom logic without external dependencies.
