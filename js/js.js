/* =====================================================================
   VIDEO LIST  -  the only part you need to edit to add/remove videos
   Fields: title (required), src (required), poster (optional thumbnail)
   ===================================================================== */
const VIDEOS = [
  {
    title: 'Ena',
    src: '/home/mteo/Vídeos/Pruebas/ENA.mp4',
    poster: 'https://i.redd.it/what-do-you-call-dream-bbq-ena-v0-6n804b0rr5xe1.gif?width=600&auto=webp&s=9b59d1125c04f6c2b82ce20a01cd9fcfa0dad12b'
  },
  {
    title: 'Gurren',
    src: '/home/mteo/Vídeos/Pruebas/Gurren.mp4',
    poster: 'https://preview.redd.it/gurren-lagann-and-what-it-means-to-be-a-man-v0-xwfvxqjocw0e1.jpg?width=1100&format=pjpg&auto=webp&s=ae393ae8964964d3ad4a1189711a64d778626a10'
  },
];

/* =====================================================================
   PLAYER SETTINGS
   loopMode        Starting repeat mode: 'off' | 'one' | 'all'
   loopModes       Modes the button / L key cycles through, in order
   showLoopButton  false hides the button (the L key still works)
   ===================================================================== */
const PLAYER_SETTINGS = {
  loopMode: 'off',
  loopModes: ['off', 'one', 'all'],
  showLoopButton: true,
};

/* =====================================================================
   SHARED HELPERS
   ===================================================================== */
const SEEK_STEP = 5;          // seconds for arrow-key seeking
const CONTROLS_HIDE_MS = 3000;

const pad = (n) => String(n).padStart(2, '0');
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const formatTime = (s) => Number.isFinite(s) ? `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}` : '00:00';

const setHidden = (node, hidden) => node.classList.toggle('hidden', hidden);
const setIcon = (svg, name) => svg.firstElementChild.setAttribute('href', `#i-${name}`);
const safePlay = (v) => Promise.resolve(v.play()).catch((err) => console.warn('Playback was prevented:', err));
const h = (tag, className, props) => Object.assign(document.createElement(tag), { className }, props);

/* =====================================================================
   PLAYLIST MODULE  -  builds the cards and reflects their state
   ===================================================================== */
function createPlaylist(listEl, videos, onSelect) {
  const items = videos.map((video, index) => {
    const btn = h('button', 'playlist-item', { type: 'button' });
    btn.setAttribute('aria-label', `Play ${video.title}`);

    const thumb = h('img', 'playlist-thumb', { alt: '', loading: 'lazy' });
    if (video.poster) thumb.src = video.poster;

    const status = h('span', 'playlist-status');
    const info = h('div', 'playlist-info');
    info.append(h('span', 'playlist-title', { textContent: video.title }), status);

    btn.append(thumb, info);
    btn.addEventListener('click', () => onSelect(index));

    const li = document.createElement('li');
    li.append(btn);
    listEl.append(li);
    return { btn, status };
  });

  return {
    update(activeIndex) {
      items.forEach(({ btn, status }, i) => {
        const active = i === activeIndex;
        btn.classList.toggle('active', active);
        status.textContent = btn.classList.contains('unavailable') ? 'Unavailable' : active ? 'Now playing' : '';
      });
    },
    setUnavailable(index, unavailable) {
      items[index].btn.classList.toggle('unavailable', unavailable);
    },
  };
}

/* =====================================================================
   PLAYER
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const IDS = [
    'videoContainer', 'mainVideo', 'videoOverlay', 'bigPlayBtn', 'spinner', 'errorMessage', 'retryBtn',
    'progressContainer', 'progressBar', 'bufferBar', 'currentTime', 'duration',
    'prevBtn', 'nextBtn', 'playPauseBtn', 'playIcon', 'muteBtn', 'volumeIcon', 'volumeSlider',
    'loopBtn', 'loopIcon', 'fullscreenBtn', 'fullscreenIcon',
    'videoTitle', 'playlist', 'autoplayNext',
  ];
  const el = Object.fromEntries(IDS.map((id) => [id, document.getElementById(id)]));
  const video = el.mainVideo;

  const { loopModes } = PLAYER_SETTINGS;
  const state = {
    index: 0,
    hideTimer: null,
    loopMode: loopModes.includes(PLAYER_SETTINGS.loopMode) ? PLAYER_SETTINGS.loopMode : loopModes[0],
  };

  const playlist = createPlaylist(el.playlist, VIDEOS, (i) => loadVideo(i, true));

  // ---------- Switcher ----------
  function refreshPlaylist() {
    playlist.update(state.index);
    el.videoTitle.textContent = VIDEOS[state.index]?.title ?? '';
  }

  function loadVideo(index, autoplay = false) {
    if (!VIDEOS.length) return;

    state.index = (index + VIDEOS.length) % VIDEOS.length; // wraps at both ends
    const { src, poster = '' } = VIDEOS[state.index];

    // Reset the UI
    setHidden(el.errorMessage, true);
    setHidden(el.spinner, false);
    setHidden(el.bigPlayBtn, false);
    el.progressBar.style.width = el.bufferBar.style.width = '0%';
    el.currentTime.textContent = el.duration.textContent = '00:00';

    video.poster = poster;
    video.src = src;
    video.load();

    playlist.setUnavailable(state.index, false); // allows retrying
    refreshPlaylist();
    if (autoplay) safePlay(video);
  }

  const playNext = () => loadVideo(state.index + 1, true);
  const playPrevious = () => loadVideo(state.index - 1, true);

  // ---------- Repeat modes ----------
  const LOOP_LABELS = {
    off: 'Repeat: off (L)',
    one: 'Repeat: current video (L)',
    all: 'Repeat: entire playlist (L)',
  };

  function setLoopMode(mode) {
    state.loopMode = mode;
    // Native looping covers "one" and a single-video "all"; multi-video "all" is handled on 'ended'
    video.loop = mode === 'one' || (mode === 'all' && VIDEOS.length === 1);
    setIcon(el.loopIcon, mode === 'one' ? 'repeat-one' : 'repeat');
    el.loopBtn.classList.toggle('active', mode !== 'off');
    el.loopBtn.setAttribute('aria-pressed', String(mode !== 'off'));
    el.loopBtn.title = LOOP_LABELS[mode];
  }

  function cycleLoopMode() {
    setLoopMode(loopModes[(loopModes.indexOf(state.loopMode) + 1) % loopModes.length]);
  }

  // ---------- Play / pause ----------
  function togglePlay() {
    if (video.paused || video.ended) safePlay(video);
    else video.pause();
  }

  // ---------- Volume ----------
  function syncVolumeUI() {
    const silent = video.muted || video.volume === 0;
    setIcon(el.volumeIcon, silent ? 'mute' : 'volume');
    el.volumeSlider.value = silent ? 0 : video.volume;
  }

  function toggleMute() {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
  }

  // ---------- Seeking ----------
  const seekBy = (delta) => { video.currentTime = clamp(video.currentTime + delta, 0, video.duration || 0); };

  // ---------- Auto-hide controls ----------
  const setInactive = (inactive) => el.videoContainer.classList.toggle('user-inactive', inactive);
  const hideIfPlaying = () => { if (!video.paused) setInactive(true); };

  function showControls() {
    setInactive(false);
    clearTimeout(state.hideTimer);
    state.hideTimer = setTimeout(hideIfPlaying, CONTROLS_HIDE_MS);
  }

  // ---------- Event wiring ----------
  const onVideo = (events, handler) => events.split(' ').forEach((e) => video.addEventListener(e, handler));

  [
    [el.playPauseBtn, togglePlay],
    [el.videoOverlay, togglePlay],
    [el.bigPlayBtn, togglePlay],
    [el.prevBtn, playPrevious],
    [el.nextBtn, playNext],
    [el.retryBtn, () => loadVideo(state.index, false)],
    [el.loopBtn, cycleLoopMode],
    [el.muteBtn, toggleMute],
    [el.fullscreenBtn, () => document.fullscreenElement
      ? document.exitFullscreen()
      : el.videoContainer.requestFullscreen().catch(console.error)],
  ].forEach(([node, handler]) => node.addEventListener('click', handler));

  el.volumeSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    video.volume = value;
    video.muted = value === 0;
  });
  onVideo('volumechange', syncVolumeUI);

  el.progressContainer.addEventListener('click', (e) => {
    if (!video.duration) return;
    const rect = el.progressContainer.getBoundingClientRect();
    video.currentTime = clamp((e.clientX - rect.left) / rect.width, 0, 1) * video.duration;
  });

  onVideo('play', () => {
    setIcon(el.playIcon, 'pause');
    setHidden(el.bigPlayBtn, true);
  });

  onVideo('pause', () => {
    setIcon(el.playIcon, 'play');
    if (!video.ended && el.errorMessage.classList.contains('hidden')) setHidden(el.bigPlayBtn, false);
    setInactive(false);
  });

  onVideo('waiting', () => setHidden(el.spinner, false));
  onVideo('canplay playing loadedmetadata', () => setHidden(el.spinner, true));
  onVideo('loadedmetadata', () => { el.duration.textContent = formatTime(video.duration); });

  onVideo('timeupdate', () => {
    if (!video.duration) return;
    el.progressBar.style.width = `${(video.currentTime / video.duration) * 100}%`;
    el.currentTime.textContent = formatTime(video.currentTime);
  });

  onVideo('progress', () => {
    if (video.duration && video.buffered.length) {
      el.bufferBar.style.width = `${(video.buffered.end(video.buffered.length - 1) / video.duration) * 100}%`;
    }
  });

  onVideo('error', () => {
    playlist.setUnavailable(state.index, true);
    refreshPlaylist();
    setHidden(el.spinner, true);
    setHidden(el.bigPlayBtn, true);
    setHidden(el.errorMessage, false);
  });

  onVideo('ended', () => {
    const isLast = state.index === VIDEOS.length - 1;
    // "one" and single-video "all" never reach here (native loop)
    if (state.loopMode === 'all' || (el.autoplayNext.checked && !isLast)) {
      playNext(); // loadVideo() wraps around
    } else {
      setHidden(el.bigPlayBtn, false);
      setInactive(false);
    }
  });

  document.addEventListener('fullscreenchange', () => {
    setIcon(el.fullscreenIcon, document.fullscreenElement ? 'compress' : 'expand');
  });

  el.videoContainer.addEventListener('mousemove', showControls);
  el.videoContainer.addEventListener('mouseleave', hideIfPlaying);

  // ---------- Keyboard shortcuts ----------
  const KEY_ACTIONS = {
    ' ': togglePlay,
    k: togglePlay,
    m: toggleMute,
    f: () => el.fullscreenBtn.click(),
    n: playNext,
    p: playPrevious,
    l: cycleLoopMode,
    arrowleft: () => seekBy(-SEEK_STEP),
    arrowright: () => seekBy(SEEK_STEP),
  };
  const PREVENT_DEFAULT = new Set([' ', 'k', 'arrowleft', 'arrowright']);

  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    const key = e.key.toLowerCase();
    const action = KEY_ACTIONS[key];

    if (!action || e.ctrlKey || e.metaKey || e.altKey) return;
    if (tag === 'INPUT' || (key === ' ' && tag === 'BUTTON')) return; // focused controls handle Space themselves

    if (PREVENT_DEFAULT.has(key)) e.preventDefault();
    action();
  });

  // ---------- Start ----------
  const hasMultiple = VIDEOS.length > 1;
  [el.prevBtn, el.nextBtn, el.autoplayNext.closest('label')].forEach((n) => setHidden(n, !hasMultiple));
  setHidden(el.loopBtn, !PLAYER_SETTINGS.showLoopButton);
  setLoopMode(state.loopMode);
  syncVolumeUI();
  loadVideo(0, false);
});
