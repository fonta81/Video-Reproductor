# Custom Video Player

A lightweight, dependency-free video player built with vanilla HTML, CSS, and JavaScript. Supports a local playlist, custom controls, keyboard shortcuts, and a clean dark UI.

## Features

- **Custom controls** — play/pause, seek bar with buffer indicator, volume slider, mute, fullscreen, and previous/next video buttons.
- **Playlist** — thumbnail grid generated automatically from the `VIDEOS` array; active item is highlighted.
- **Autoplay next** — optional toggle that advances to the next video when the current one ends.
- **Buffering spinner** — shown while the browser is fetching data.
- **Error handling** — cards marked as "Unavailable" when a video fails to load, with a "Try again" button.
- **Auto-hide controls** — controls fade out after 3 seconds of inactivity during playback.
- **Keyboard shortcuts** — full keyboard support (see table below).
- **Responsive** — adapts to small screens (≤ 520 px) with a stacked header layout.

## Project Structure

```
Video-Reproductor/
├── index.html   # Player markup and playlist section
├── js.js        # All logic: playlist, controls, keyboard, events
└── style.css    # Dark theme, responsive layout, animations
```

## Getting Started

Because the player reads local file paths, just open `index.html` directly in a browser — no server required.

```bash
# Clone or download the project, then open:
xdg-open index.html   # Linux
open index.html       # macOS
# Or double-click index.html in your file manager
```

> **Note:** Some browsers block playback of `file://` videos for security reasons. If that happens, serve the folder with a simple local server:
> ```bash
> npx serve .
> # or
> python3 -m http.server
> ```

## Adding / Removing Videos

Edit the `VIDEOS` array at the **top of [`js.js`](js.js)**. It is the only section you need to touch.

```js
const VIDEOS = [
  {
    title: 'My Video',                    // Required — displayed in the playlist and header
    src: '/path/to/video.mp4',            // Required — absolute or relative path / URL
    poster: 'https://example.com/img.jpg' // Optional — thumbnail shown before playback
  },
  // Add more objects here…
];
```

| Field    | Required | Description                                      |
|----------|----------|--------------------------------------------------|
| `title`  | ✅       | Name shown in the playlist card and "Now playing" header |
| `src`    | ✅       | Video source — local path or remote URL          |
| `poster` | ❌       | Thumbnail image URL (16:9 looks best)            |

## ⌨️ Keyboard Shortcuts

| Key             | Action                     |
|-----------------|----------------------------|
| `Space` / `K`   | Play / Pause               |
| `M`             | Toggle mute                |
| `F`             | Toggle fullscreen          |
| `N`             | Next video                 |
| `P`             | Previous video             |
| `←` Arrow Left  | Seek back 5 seconds        |
| `→` Arrow Right | Seek forward 5 seconds     |

> Shortcuts are disabled when an `<input>` is focused, so you can type freely (e.g., in the volume slider range input).

## 🛠️ Tech Stack

| Technology | Role |
|------------|------|
| HTML5 `<video>` | Native video playback |
| Vanilla JavaScript (ES6+) | All player logic |
| CSS3 (custom properties, Grid, Flexbox) | Layout and animations |

No frameworks, no build step, no dependencies.
