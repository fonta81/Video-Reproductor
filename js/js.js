/* =====================================================================
   VIDEO LIST  -  the only part you need to edit to add/remove videos
   Fields: title (required), src (required), poster (optional thumbnail)
   ===================================================================== */
var VIDEOS = [
  {
    title: 'Ena',
    src: './videos/ENA.mp4',
    poster: 'https://i.redd.it/what-do-you-call-dream-bbq-ena-v0-6n804b0rr5xe1.gif?width=600&auto=webp&s=9b59d1125c04f6c2b82ce20a01cd9fcfa0dad12b'
  },
  {
    title: 'Gurren',
    src: './videos/Gurren.mp4',
    poster: 'https://preview.redd.it/gurren-lagann-and-what-it-means-to-be-a-man-v0-xwfvxqjocw0e1.jpg?width=1100&format=pjpg&auto=webp&s=ae393ae8964964d3ad4a1189711a64d778626a10'
  }
];

/* =====================================================================
   PLAYER SETTINGS
   loopMode        Starting repeat mode: 'off' | 'one' | 'all'
   loopModes       Modes the button / L key cycles through, in order
   showLoopButton  false hides the button (the L key still works)
   ===================================================================== */
var PLAYER_SETTINGS = {
  loopMode: 'off',
  loopModes: ['off', 'one', 'all'],
  showLoopButton: true
};

/* =====================================================================
   Everything below is plain ES5 (no arrow functions, let/const, template
   literals, spread, Promise-only APIs, classList, etc.).
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------
     CONSTANTS
     --------------------------------------------------------------- */
  var SEEK_STEP = 5;            // seconds, arrow-key seeking
  var MEDIA_SEEK_STEP = 10;     // seconds, remote FF / RW keys
  var VOLUME_STEP = 0.1;
  var CONTROLS_HIDE_MS = 3000;

  // Key codes (keyboard + Samsung Tizen + LG webOS/NetCast remotes)
  var KEY = {
    BACKSPACE: 8, ENTER: 13, ESC: 27, SPACE: 32,
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
    F: 70, K: 75, L: 76, M: 77, N: 78, P: 80,
    MEDIA_PAUSE: 19,
    MEDIA_STOP: 413,
    MEDIA_REWIND: 412,
    MEDIA_PLAY: 415,
    MEDIA_FAST_FORWARD: 417,
    WEBOS_BACK: 461,
    TIZEN_BACK: 10009,
    TIZEN_PREV: 10232,
    TIZEN_NEXT: 10233,
    TIZEN_PLAY_PAUSE: 10252
  };

  /* ---------------------------------------------------------------
     SHARED HELPERS
     --------------------------------------------------------------- */
  function log() {
    if (window.console && window.console.log) {
      try { window.console.log.apply(window.console, arguments); } catch (e) { /* ignore */ }
    }
  }

  function pad(n) {
    n = String(n);
    return n.length < 2 ? '0' + n : n;
  }

  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function formatTime(s) {
    if (typeof s !== 'number' || !isFinite(s) || s < 0) { return '00:00'; }
    return pad(Math.floor(s / 60)) + ':' + pad(Math.floor(s % 60));
  }

  // classList replacement (missing or partial on some old TV engines)
  function hasClass(node, name) {
    return (' ' + node.className + ' ').indexOf(' ' + name + ' ') !== -1;
  }

  function addClass(node, name) {
    if (!hasClass(node, name)) {
      node.className = node.className ? node.className + ' ' + name : name;
    }
  }

  function removeClass(node, name) {
    while (hasClass(node, name)) {
      node.className = (' ' + node.className + ' ')
        .replace(' ' + name + ' ', ' ')
        .replace(/^\s+|\s+$/g, '');
    }
  }

  function toggleClass(node, name, on) {
    if (on === undefined) { on = !hasClass(node, name); }
    if (on) { addClass(node, name); } else { removeClass(node, name); }
  }

  function setHidden(node, hidden) {
    toggleClass(node, 'hidden', hidden);
  }

  function on(node, type, handler) {
    if (node.addEventListener) {
      node.addEventListener(type, handler, false);
    } else if (node.attachEvent) {
      node.attachEvent('on' + type, handler);
    }
  }

  function onMany(node, types, handler) {
    var list = types.split(' ');
    for (var i = 0; i < list.length; i++) { on(node, list[i], handler); }
  }

  function stop(e) {
    if (e.preventDefault) { e.preventDefault(); } else { e.returnValue = false; }
  }

  // play() returns a Promise on modern engines and undefined on old ones
  function safePlay(v) {
    try {
      var p = v.play();
      if (p && typeof p.then === 'function') {
        p.then(null, function (err) { log('Playback was prevented:', err); });
      }
    } catch (err) {
      log('Playback error:', err);
    }
  }

  function createEl(tag, className, props) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (props) {
      for (var key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key)) { node[key] = props[key]; }
      }
    }
    return node;
  }

  function setBackgroundImage(node, url) {
    node.style.backgroundImage = 'url("' + String(url).replace(/"/g, '%22') + '")';
  }

  function each(list, fn) {
    for (var i = 0; i < list.length; i++) { fn(list[i], i); }
  }

  function indexOf(list, item) {
    for (var i = 0; i < list.length; i++) { if (list[i] === item) { return i; } }
    return -1;
  }

  function pointerX(e) {
    if (typeof e.clientX === 'number') { return e.clientX; }
    return e.pageX - (window.pageXOffset || 0);
  }

  // Fractional position (0..1) of a pointer event inside a bar element
  function fractionInBar(e, bar) {
    var rect = bar.getBoundingClientRect();
    var width = rect.width || bar.offsetWidth || 1;
    return clamp((pointerX(e) - rect.left) / width, 0, 1);
  }

  /* =====================================================================
     PLAYLIST MODULE  -  builds the cards and reflects their state
     ===================================================================== */
  function createPlaylist(listEl, videos, onSelect) {
    var items = [];

    function build(video, index) {
      var btn = createEl('button', 'playlist-item', { type: 'button' });
      btn.setAttribute('aria-label', 'Play ' + video.title);

      var thumb = createEl('span', 'playlist-thumb');
      var img = createEl('span', 'playlist-thumb-img');
      if (video.poster) { setBackgroundImage(img, video.poster); }
      thumb.appendChild(img);

      var status = createEl('span', 'playlist-status');
      var info = createEl('span', 'playlist-info');
      info.appendChild(createEl('span', 'playlist-title', { textContent: video.title }));
      info.appendChild(status);

      btn.appendChild(thumb);
      btn.appendChild(info);
      on(btn, 'click', function () { onSelect(index); });

      var li = document.createElement('li');
      li.appendChild(btn);
      listEl.appendChild(li);
      items.push({ btn: btn, li: li, status: status });
    }

    each(videos, build);

    return {
      buttons: function () {
        var list = [];
        each(items, function (item) { list.push(item.btn); });
        return list;
      },
      update: function (activeIndex) {
        each(items, function (item, i) {
          var active = i === activeIndex;
          toggleClass(item.btn, 'active', active);
          item.status.textContent = hasClass(item.btn, 'unavailable')
            ? 'Unavailable'
            : (active ? 'Now playing' : '');
        });
      },
      setUnavailable: function (index, unavailable) {
        if (items[index]) { toggleClass(items[index].btn, 'unavailable', unavailable); }
      }
    };
  }

  /* =====================================================================
     PLAYER  (the script tag sits at the end of <body>, so the DOM is ready)
     ===================================================================== */
  function init() {
    var IDS = [
      'videoContainer', 'mainVideo', 'videoOverlay', 'bigPlayBtn', 'spinner', 'errorMessage', 'retryBtn',
      'progressContainer', 'progressBar', 'bufferBar', 'currentTime', 'duration',
      'prevBtn', 'nextBtn', 'playPauseBtn', 'muteBtn', 'volumeBar', 'volumeFill',
      'loopBtn', 'fullscreenBtn',
      'videoTitle', 'playlist', 'autoplayNext', 'autoplayLabel'
    ];
    var el = {};
    each(IDS, function (id) { el[id] = document.getElementById(id); });
    var video = el.mainVideo;

    var loopModes = PLAYER_SETTINGS.loopModes;
    var state = {
      index: 0,
      hideTimer: null,
      pseudoFs: false,
      shownSecond: -1,
      loopMode: indexOf(loopModes, PLAYER_SETTINGS.loopMode) !== -1 ? PLAYER_SETTINGS.loopMode : loopModes[0]
    };

    var playlist = createPlaylist(el.playlist, VIDEOS, function (i) { loadVideo(i, true); });

    // ---------- Switcher ----------
    function refreshPlaylist() {
      playlist.update(state.index);
      el.videoTitle.textContent = VIDEOS[state.index] ? VIDEOS[state.index].title : '';
    }

    function loadVideo(index, autoplay) {
      if (!VIDEOS.length) { return; }

      state.index = (index + VIDEOS.length) % VIDEOS.length; // wraps at both ends
      var item = VIDEOS[state.index];

      // Reset the UI
      setHidden(el.errorMessage, true);
      setHidden(el.spinner, false);
      setHidden(el.bigPlayBtn, false);
      el.progressBar.style.width = '0%';
      el.bufferBar.style.width = '0%';
      el.currentTime.textContent = '00:00';
      el.duration.textContent = '00:00';
      state.shownSecond = -1;

      video.poster = item.poster || '';
      video.src = item.src;
      try { video.load(); } catch (err) { log('load() failed:', err); }

      playlist.setUnavailable(state.index, false); // allows retrying
      refreshPlaylist();
      if (autoplay) { safePlay(video); }
    }

    function playNext() { loadVideo(state.index + 1, true); }
    function playPrevious() { loadVideo(state.index - 1, true); }

    function restartCurrent() {
      try { video.currentTime = 0; } catch (err) { log('seek failed:', err); }
      safePlay(video);
    }

    // ---------- Repeat modes ----------
    var LOOP_LABELS = {
      off: 'Repeat: off (L)',
      one: 'Repeat: current video (L)',
      all: 'Repeat: entire playlist (L)'
    };

    // Looping is handled on 'ended' (video.loop is unreliable on old engines)
    function setLoopMode(mode) {
      state.loopMode = mode;
      toggleClass(el.loopBtn, 'on', mode === 'one');       // swaps to the "repeat one" icon
      toggleClass(el.loopBtn, 'active', mode !== 'off');
      el.loopBtn.setAttribute('aria-pressed', String(mode !== 'off'));
      el.loopBtn.title = LOOP_LABELS[mode] || '';
    }

    function cycleLoopMode() {
      setLoopMode(loopModes[(indexOf(loopModes, state.loopMode) + 1) % loopModes.length]);
    }

    // ---------- Play / pause ----------
    function togglePlay() {
      if (video.paused || video.ended) { safePlay(video); } else { video.pause(); }
    }

    // ---------- Volume ----------
    function syncVolumeUI() {
      var silent = video.muted || video.volume === 0;
      var pct = silent ? 0 : Math.round(video.volume * 100);
      toggleClass(el.muteBtn, 'on', silent);
      el.volumeFill.style.width = pct + '%';
      el.volumeBar.setAttribute('aria-valuenow', String(pct));
    }

    function setVolume(value) {
      value = clamp(value, 0, 1);
      try {
        video.volume = value;
        video.muted = value === 0;
      } catch (err) { log('volume failed:', err); }
      syncVolumeUI();
    }

    function toggleMute() {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) { video.volume = 1; }
      syncVolumeUI();
    }

    function changeVolume(delta) {
      var current = video.muted ? 0 : video.volume;
      setVolume(Math.round((current + delta) * 100) / 100);
    }

    // ---------- Seeking ----------
    function seekBy(delta) {
      var duration = video.duration;
      if (typeof duration !== 'number' || !isFinite(duration)) { return; }
      try { video.currentTime = clamp(video.currentTime + delta, 0, duration); } catch (err) { log('seek failed:', err); }
    }

    // ---------- Fullscreen (real API, vendor prefixes, then a CSS fallback) ----------
    function getFullscreenElement() {
      return document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement || null;
    }

    function syncFullscreenUI() {
      var full = !!getFullscreenElement() || state.pseudoFs;
      toggleClass(el.videoContainer, 'is-fullscreen', full);
      toggleClass(el.fullscreenBtn, 'on', full);
    }

    function setPseudoFullscreen(enabled) {
      state.pseudoFs = enabled;
      toggleClass(el.videoContainer, 'pseudo-fullscreen', enabled);
      document.body.style.overflow = enabled ? 'hidden' : '';
      syncFullscreenUI();
    }

    function isFullscreen() {
      return !!getFullscreenElement() || state.pseudoFs;
    }

    function toggleFullscreen() {
      var box = el.videoContainer;

      if (state.pseudoFs) { setPseudoFullscreen(false); return; }

      if (getFullscreenElement()) {
        var exit = document.exitFullscreen || document.webkitExitFullscreen ||
          document.webkitCancelFullScreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exit) { try { exit.call(document); } catch (err) { log(err); } }
        return;
      }

      var request = box.requestFullscreen || box.webkitRequestFullscreen ||
        box.webkitRequestFullScreen || box.mozRequestFullScreen || box.msRequestFullscreen;
      if (!request) { setPseudoFullscreen(true); return; }

      try {
        var result = request.call(box);
        if (result && typeof result.then === 'function') {
          result.then(null, function () { setPseudoFullscreen(true); });
        }
      } catch (err) {
        setPseudoFullscreen(true);
      }
    }

    // ---------- Auto-hide controls ----------
    function setInactive(inactive) { toggleClass(el.videoContainer, 'user-inactive', inactive); }
    function hideIfPlaying() { if (!video.paused) { setInactive(true); } }

    function showControls() {
      setInactive(false);
      clearTimeout(state.hideTimer);
      state.hideTimer = setTimeout(hideIfPlaying, CONTROLS_HIDE_MS);
    }

    // ---------- Mouse / click wiring ----------
    each([
      [el.playPauseBtn, togglePlay],
      [el.videoOverlay, togglePlay],
      [el.bigPlayBtn, togglePlay],
      [el.prevBtn, playPrevious],
      [el.nextBtn, playNext],
      [el.retryBtn, function () { loadVideo(state.index, false); }],
      [el.loopBtn, cycleLoopMode],
      [el.muteBtn, toggleMute],
      [el.fullscreenBtn, toggleFullscreen]
    ], function (pair) { on(pair[0], 'click', pair[1]); });

    on(el.volumeBar, 'click', function (e) {
      setVolume(fractionInBar(e || window.event, el.volumeBar));
    });

    on(el.progressContainer, 'click', function (e) {
      var duration = video.duration;
      if (typeof duration !== 'number' || !isFinite(duration) || !duration) { return; }
      try { video.currentTime = fractionInBar(e || window.event, el.progressContainer) * duration; } catch (err) { log(err); }
    });

    on(el.videoContainer, 'mousemove', showControls);
    on(el.videoContainer, 'mouseleave', hideIfPlaying);

    // ---------- Video events ----------
    onMany(video, 'volumechange', syncVolumeUI);

    on(video, 'play', function () {
      addClass(el.playPauseBtn, 'on');
      setHidden(el.bigPlayBtn, true);
      showControls();
    });

    on(video, 'pause', function () {
      removeClass(el.playPauseBtn, 'on');
      if (!video.ended && hasClass(el.errorMessage, 'hidden')) { setHidden(el.bigPlayBtn, false); }
      clearTimeout(state.hideTimer);
      setInactive(false);
    });

    on(video, 'waiting', function () { setHidden(el.spinner, false); });
    onMany(video, 'canplay playing loadeddata loadedmetadata', function () { setHidden(el.spinner, true); });
    on(video, 'loadedmetadata', function () { el.duration.textContent = formatTime(video.duration); });
    on(video, 'durationchange', function () { el.duration.textContent = formatTime(video.duration); });

    on(video, 'timeupdate', function () {
      var duration = video.duration;
      if (typeof duration !== 'number' || !isFinite(duration) || !duration) { return; }
      el.progressBar.style.width = ((video.currentTime / duration) * 100) + '%';

      // Only touch the DOM text when the displayed second changes (cheaper on slow TVs)
      var second = Math.floor(video.currentTime);
      if (second !== state.shownSecond) {
        state.shownSecond = second;
        el.currentTime.textContent = formatTime(video.currentTime);
      }
    });

    on(video, 'progress', function () {
      var duration = video.duration;
      if (duration && video.buffered && video.buffered.length) {
        try {
          el.bufferBar.style.width = ((video.buffered.end(video.buffered.length - 1) / duration) * 100) + '%';
        } catch (err) { /* ranges can change while reading */ }
      }
    });

    on(video, 'error', function () {
      playlist.setUnavailable(state.index, true);
      refreshPlaylist();
      setHidden(el.spinner, true);
      setHidden(el.bigPlayBtn, true);
      setHidden(el.errorMessage, false);
      try { el.retryBtn.focus(); } catch (err) { /* ignore */ }
    });

    on(video, 'ended', function () {
      var isLast = state.index === VIDEOS.length - 1;

      if (state.loopMode === 'one') { restartCurrent(); return; }
      if (state.loopMode === 'all') {
        if (VIDEOS.length === 1) { restartCurrent(); } else { playNext(); } // loadVideo() wraps around
        return;
      }
      if (el.autoplayNext.checked && !isLast && VIDEOS.length > 1) {
        playNext();
      } else {
        setHidden(el.bigPlayBtn, false);
        setInactive(false);
      }
    });

    onMany(document, 'fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', syncFullscreenUI);

    // ---------- Remote / keyboard focus navigation ----------
    function isShown(node) {
      return !!node && !hasClass(node, 'hidden') && (node.offsetWidth > 0 || node.offsetHeight > 0);
    }

    function filterShown(list) {
      var out = [];
      each(list, function (node) { if (isShown(node)) { out.push(node); } });
      return out;
    }

    // Focusable rows, top to bottom. Playlist cards are grouped by their on-screen row.
    function getNavRows() {
      var rows = [
        [el.videoContainer],
        [el.progressContainer],
        filterShown([el.prevBtn, el.playPauseBtn, el.nextBtn, el.muteBtn, el.volumeBar, el.loopBtn, el.fullscreenBtn]),
        filterShown([el.autoplayNext])
      ];

      var cards = playlist.buttons();
      var current = null;
      var currentTop = null;
      each(cards, function (btn) {
        var top = btn.getBoundingClientRect().top;
        if (current === null || Math.abs(top - currentTop) > 4) {
          current = [];
          currentTop = top;
          rows.push(current);
        }
        current.push(btn);
      });
      return rows;
    }

    function centerX(node) {
      var rect = node.getBoundingClientRect();
      return rect.left + (rect.width || node.offsetWidth) / 2;
    }

    function focusNode(node) {
      try { node.focus(); } catch (err) { log(err); }
    }

    function locate(rows, node) {
      for (var r = 0; r < rows.length; r++) {
        for (var c = 0; c < rows[r].length; c++) {
          if (rows[r][c] === node) { return { row: r, col: c }; }
        }
      }
      return null;
    }

    function moveFocus(direction) {
      var rows = getNavRows();
      var pos = locate(rows, document.activeElement);

      if (!pos) { focusNode(el.videoContainer); return; }

      if (direction === 'left' || direction === 'right') {
        var target = rows[pos.row][pos.col + (direction === 'left' ? -1 : 1)];
        if (target) { focusNode(target); }
        return;
      }

      var step = direction === 'up' ? -1 : 1;
      var r = pos.row + step;
      while (rows[r] && rows[r].length === 0) { r += step; }
      if (!rows[r]) { return; }

      // pick the element in the next row closest (horizontally) to the current one
      var fromX = centerX(document.activeElement);
      var best = rows[r][0];
      var bestDist = Math.abs(centerX(best) - fromX);
      for (var i = 1; i < rows[r].length; i++) {
        var dist = Math.abs(centerX(rows[r][i]) - fromX);
        if (dist < bestDist) { best = rows[r][i]; bestDist = dist; }
      }
      focusNode(best);
    }

    // Tizen only delivers media keys to apps that register them
    function registerTvKeys() {
      try {
        if (window.tizen && window.tizen.tvinputdevice) {
          each(['MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop',
            'MediaRewind', 'MediaFastForward', 'MediaTrackPrevious', 'MediaTrackNext'], function (name) {
            try { window.tizen.tvinputdevice.registerKey(name); } catch (err) { /* key not supported */ }
          });
        }
      } catch (err) { /* not a Tizen TV */ }
    }

    function handleBack() {
      if (isFullscreen()) { toggleFullscreen(); return; }
      if (document.activeElement !== el.videoContainer) { focusNode(el.videoContainer); return; }
      // Already on the player: let Tizen exit the app (other platforms handle Back natively)
      try {
        if (window.tizen && window.tizen.application) { window.tizen.application.getCurrentApplication().exit(); }
      } catch (err) { /* ignore */ }
    }

    function onKeyDown(e) {
      e = e || window.event;
      var code = e.keyCode || e.which;
      if (e.ctrlKey || e.metaKey || e.altKey) { return; }

      var active = document.activeElement;
      var tag = active ? active.tagName : '';
      var onPlayer = !active || active === document.body || active === el.videoContainer;
      var onProgress = active === el.progressContainer;
      var onVolume = active === el.volumeBar;
      var handled = true;

      switch (code) {
        case KEY.SPACE:
          if (tag === 'BUTTON' || tag === 'INPUT') { return; } // focused controls handle Space themselves
          togglePlay();
          break;
        case KEY.K:
        case KEY.TIZEN_PLAY_PAUSE:
          togglePlay();
          break;
        case KEY.MEDIA_PLAY:
          safePlay(video);
          break;
        case KEY.MEDIA_PAUSE:
          video.pause();
          break;
        case KEY.MEDIA_STOP:
          video.pause();
          try { video.currentTime = 0; } catch (err) { /* ignore */ }
          break;
        case KEY.MEDIA_FAST_FORWARD:
          seekBy(MEDIA_SEEK_STEP);
          break;
        case KEY.MEDIA_REWIND:
          seekBy(-MEDIA_SEEK_STEP);
          break;
        case KEY.M:
          toggleMute();
          break;
        case KEY.F:
          toggleFullscreen();
          break;
        case KEY.N:
        case KEY.TIZEN_NEXT:
          playNext();
          break;
        case KEY.P:
        case KEY.TIZEN_PREV:
          playPrevious();
          break;
        case KEY.L:
          cycleLoopMode();
          break;
        case KEY.LEFT:
        case KEY.RIGHT:
          if (onPlayer || onProgress) {
            seekBy(code === KEY.LEFT ? -SEEK_STEP : SEEK_STEP);
          } else if (onVolume) {
            changeVolume(code === KEY.LEFT ? -VOLUME_STEP : VOLUME_STEP);
          } else {
            moveFocus(code === KEY.LEFT ? 'left' : 'right');
          }
          break;
        case KEY.UP:
          moveFocus('up');
          break;
        case KEY.DOWN:
          moveFocus('down');
          break;
        case KEY.ENTER:
          if (onPlayer || onProgress) {
            togglePlay();
          } else if (onVolume) {
            toggleMute();
          } else if (active && active.click) {
            active.click();
          } else {
            handled = false;
          }
          break;
        case KEY.TIZEN_BACK:
        case KEY.WEBOS_BACK:
        case KEY.ESC:
          if (code === KEY.ESC && !state.pseudoFs) { return; } // real fullscreen already handles Esc natively
          handleBack();
          break;
        default:
          handled = false;
      }

      if (handled) {
        stop(e);
        showControls();
      }
    }

    on(document, 'keydown', onKeyDown);

    // ---------- Start ----------
    var hasMultiple = VIDEOS.length > 1;
    each([el.prevBtn, el.nextBtn, el.autoplayLabel], function (node) { setHidden(node, !hasMultiple); });
    setHidden(el.loopBtn, !PLAYER_SETTINGS.showLoopButton);
    registerTvKeys();
    setLoopMode(state.loopMode);
    syncVolumeUI();
    syncFullscreenUI();
    loadVideo(0, false);
    focusNode(el.videoContainer); // so remote arrows seek right away
  }

  init();
}());
