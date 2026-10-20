/* =====================================================================
   LISTA DE VIDEOS  -  la unica parte que necesitas editar para agregar
   o quitar videos de la lista de reproduccion.
   Campos: title (requerido), src (requerido), poster (miniatura opcional)
   ===================================================================== */
var VIDEOS = [
  // { EJEMPLO:
  //   title: 'Ena',
  //   src: './videos/ENA.mp4',
  //   poster: 'https://...imagen.jpg'
  // },
  {
    title: 'Ena',
    src: './videos/ENA.mp4',
    poster: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcST0km15wmNSbKN8Vkdc3v2v3l0dX5h_WwOVlul5CKx3Q&s=10'
  },
  {
    title: 'Gurren',
    src: './videos/Gurran.mp4',
    poster: 'https://preview.redd.it/gurren-lagann-and-what-it-means-to-be-a-man-v0-xwfvxqjocw0e1.jpg?width=1100&format=pjpg&auto=webp&s=ae393ae8964964d3ad4a1189711a64d778626a10'
  }
];

/* =====================================================================
   CONFIGURACION DEL REPRODUCTOR
   loopMode        Modo de repeticion inicial: 'off' | 'one' | 'all'
   loopModes       Modos por los que cicla el boton / tecla L, en orden
   showLoopButton  false oculta el boton de repeticion (la tecla L sigue)
   ===================================================================== */
var PLAYER_SETTINGS = {
  loopMode: 'all',
  loopModes: ['off', 'one', 'all'],
  showLoopButton: true
};

/* =====================================================================
   Todo lo que sigue es JavaScript ES5 puro (sin arrow functions,
   let/const, template literals, spread, APIs basadas en Promises,
   classList, etc.). Asi corre de forma nativa en Smart TVs antiguas
   (Samsung Tizen, LG webOS, NetCast) sin transpiladores ni polyfills.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------
     CONSTANTES
     --------------------------------------------------------------- */
  var SEEK_STEP = 5;            // segundos, al retroceder/avanzar con flechas
  var MEDIA_SEEK_STEP = 10;     // segundos, teclas de RW / FF del mando
  var VOLUME_STEP = 0.1;        // incremento de volumen con flechas
  var CONTROLS_HIDE_MS = 3000;  // ms de inactividad antes de ocultar controles

  // Codigos de tecla: teclado estandar + mandos de Samsung Tizen y LG webOS/NetCast.
  // Los codigos de TV (4xx/10xxx) son fijos y vienen definidos por cada plataforma.
  var KEY = {
    BACKSPACE: 8, ENTER: 13, ESC: 27, SPACE: 32,
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
    F: 70, K: 75, L: 76, M: 77, N: 78, P: 80,
    MEDIA_PAUSE: 19,              // tecla Pause (tambien usada por algunos mandos)
    MEDIA_STOP: 413,              // Stop del mando
    MEDIA_REWIND: 412,            // Retroceso del mando
    MEDIA_PLAY: 415,              // Play del mando
    MEDIA_FAST_FORWARD: 417,      // Avance rapido del mando
    WEBOS_BACK: 461,              // Back en LG webOS
    TIZEN_BACK: 10009,            // Back en Samsung Tizen
    TIZEN_PREV: 10232,            // Track anterior en Tizen
    TIZEN_NEXT: 10233,            // Track siguiente en Tizen
    TIZEN_PLAY_PAUSE: 10252       // Play/Pause en Tizen
  };

  /* ---------------------------------------------------------------
     HELPERS COMPARTIDOS
     --------------------------------------------------------------- */

  // console.log seguro: algunos navegadores embebidos fallan al aplicar
  // 'arguments', por eso el try/catch.
  function log() {
    if (window.console && window.console.log) {
      try { window.console.log.apply(window.console, arguments); } catch (e) { /* ignorar */ }
    }
  }

  // "5" -> "05": pone un cero a la izquierda para el formato MM:SS
  function pad(n) {
    n = String(n);
    return n.length < 2 ? '0' + n : n;
  }

  // Limita un numero entre min y max (para volumen, seeks y porcentajes)
  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  // Segundos -> "MM:SS". Devuelve "00:00" si el valor no es usable aun
  // (metadatos no cargados, NaN, Infinity...).
  function formatTime(s) {
    if (typeof s !== 'number' || !isFinite(s) || s < 0) { return '00:00'; }
    return pad(Math.floor(s / 60)) + ':' + pad(Math.floor(s % 60));
  }

  // --- Sustitutos de classList (ausente o incompleto en motores viejos de TV) ---
  // Todos trabajan sobre node.className (string) en lugar de la API moderna.

  // Busca la clase rodeada de espacios para no confundir "on" con "one"
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
        .replace(/^\s+|\s+$/g, ''); // trim manual (String.trim no existe en ES3)
    }
  }

  // Con 'on' indefinido hace toggle; con true/false fuerza el estado
  function toggleClass(node, name, on) {
    if (on === undefined) { on = !hasClass(node, name); }
    if (on) { addClass(node, name); } else { removeClass(node, name); }
  }

  // Oculta/muestra un nodo usando la utilidad CSS .hidden
  function setHidden(node, hidden) {
    toggleClass(node, 'hidden', hidden);
  }

  // addEventListener con fallback a attachEvent (IE8 / motores muy viejos)
  function on(node, type, handler) {
    if (node.addEventListener) {
      node.addEventListener(type, handler, false);
    } else if (node.attachEvent) {
      node.attachEvent('on' + type, handler);
    }
  }

  // Ataja varios eventos a la vez: onMany(video, 'canplay playing', fn)
  function onMany(node, types, handler) {
    var list = types.split(' ');
    for (var i = 0; i < list.length; i++) { on(node, list[i], handler); }
  }

  // preventDefault con fallback para motores viejos
  function stop(e) {
    if (e.preventDefault) { e.preventDefault(); } else { e.returnValue = false; }
  }

  // play() devuelve una Promise en motores modernos y undefined en los
  // antiguos; este helper tolera ambos casos y loguea rechazos
  // (p. ej. autoplay bloqueado por el navegador).
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

  // Crea un elemento, le asigna clase y propiedades en un solo paso
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

  // Aplica una imagen de fondo escapando comillas dobles (evita romper el CSS)
  function setBackgroundImage(node, url) {
    node.style.backgroundImage = 'url("' + String(url).replace(/"/g, '%22') + '")';
  }

  // forEach manual (Array.prototype.forEach no existe en ES3)
  function each(list, fn) {
    for (var i = 0; i < list.length; i++) { fn(list[i], i); }
  }

  // indexOf manual por la misma razon
  function indexOf(list, item) {
    for (var i = 0; i < list.length; i++) { if (list[i] === item) { return i; } }
    return -1;
  }

  // Coordenada X de un evento de raton/tactil (algunos motores viejos
  // solo exponen pageX, no clientX)
  function pointerX(e) {
    if (typeof e.clientX === 'number') { return e.clientX; }
    return e.pageX - (window.pageXOffset || 0);
  }

  // Posicion fraccional (0..1) del puntero dentro de una barra (progreso
  // o volumen): es lo que permite hacer clic/tocar para saltar a un punto.
  function fractionInBar(e, bar) {
    var rect = bar.getBoundingClientRect();
    var width = rect.width || bar.offsetWidth || 1;
    return clamp((pointerX(e) - rect.left) / width, 0, 1);
  }

  /* =====================================================================
     MODULO DE LISTA DE REPRODUCCION  -  construye las tarjetas y refleja
     su estado (activa / "Now playing" / "Unavailable")
     ===================================================================== */
  function createPlaylist(listEl, videos, onSelect) {
    var items = [];

    // Construye la tarjeta de un video y la agrega a la lista <ul>
    function build(video, index) {
      var btn = createEl('button', 'playlist-item', { type: 'button' });
      btn.setAttribute('aria-label', 'Play ' + video.title);

      // Miniatura 16:9: un span con la imagen como fondo (ver CSS)
      var thumb = createEl('span', 'playlist-thumb');
      var img = createEl('span', 'playlist-thumb-img');
      if (video.poster) { setBackgroundImage(img, video.poster); }
      thumb.appendChild(img);

      // Titulo + linea de estado ("Now playing" / "Unavailable" / vacia)
      var status = createEl('span', 'playlist-status');
      var info = createEl('span', 'playlist-info');
      info.appendChild(createEl('span', 'playlist-title', { textContent: video.title }));
      info.appendChild(status);

      btn.appendChild(thumb);
      btn.appendChild(info);
      on(btn, 'click', function () { onSelect(index); });

      // Cada tarjeta vive dentro de un <li> (asi el CSS en columnas funciona)
      var li = document.createElement('li');
      li.appendChild(btn);
      listEl.appendChild(li);
      items.push({ btn: btn, li: li, status: status });
    }

    each(videos, build);

    // API publica del modulo
    return {
      // Devuelve los botones de tarjeta (los usa la navegacion con mando)
      buttons: function () {
        var list = [];
        each(items, function (item) { list.push(item.btn); });
        return list;
      },
      // Marca la tarjeta activa y actualiza los textos de estado
      update: function (activeIndex) {
        each(items, function (item, i) {
          var active = i === activeIndex;
          toggleClass(item.btn, 'active', active);
          item.status.textContent = hasClass(item.btn, 'unavailable')
            ? 'Unavailable'
            : (active ? 'Now playing' : '');
        });
      },
      // Marca/desmarca una tarjeta como no disponible (fallo de carga)
      setUnavailable: function (index, unavailable) {
        if (items[index]) { toggleClass(items[index].btn, 'unavailable', unavailable); }
      }
    };
  }

  /* =====================================================================
     REPRODUCTOR  (el <script> esta al final de <body>, asi que el DOM
     ya esta listo cuando esto se ejecuta)
     ===================================================================== */
  function init() {
    // IDs de todos los elementos que el script necesita; se resuelven en
    // un solo recorrido para no repetir getElementById por todas partes.
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
    // Estado interno del reproductor
    var state = {
      index: 0,          // posicion actual dentro de VIDEOS
      hideTimer: null,   // temporizador de auto-ocultado de controles
      pseudoFs: false,   // true cuando el fallback CSS de fullscreen esta activo
      shownSecond: -1,   // ultimo segundo pintado en el reloj (evita tocar el DOM en vano)
      loopMode: indexOf(loopModes, PLAYER_SETTINGS.loopMode) !== -1 ? PLAYER_SETTINGS.loopMode : loopModes[0]
    };

    // Crea la lista de reproduccion; al hacer clic en una tarjeta se carga
    // ese video con autoplay
    var playlist = createPlaylist(el.playlist, VIDEOS, function (i) { loadVideo(i, true); });

    // ---------- Selector de videos ----------
    // Refresca titulo y tarjetas tras un cambio de video
    function refreshPlaylist() {
      playlist.update(state.index);
      el.videoTitle.textContent = VIDEOS[state.index] ? VIDEOS[state.index].title : '';
    }

    // Carga el video en la posicion 'index' (con wrap-around: acepta
    // indices fuera de rango para poder ir del ultimo al primero).
    // autoplay=true lo reproduce de inmediato.
    function loadVideo(index, autoplay) {
      if (!VIDEOS.length) { return; }

      state.index = (index + VIDEOS.length) % VIDEOS.length; // envuelve en ambos extremos
      var item = VIDEOS[state.index];

      // Reinicio de la UI: se oculta el error y se muestra spinner + boton grande
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

      playlist.setUnavailable(state.index, false); // permite reintentar cargas fallidas
      refreshPlaylist();
      if (autoplay) { safePlay(video); }
    }

    function playNext() { loadVideo(state.index + 1, true); }
    function playPrevious() { loadVideo(state.index - 1, true); }

    // Reinicia el video actual desde el principio (modo "Repeat Current")
    function restartCurrent() {
      try { video.currentTime = 0; } catch (err) { log('seek failed:', err); }
      safePlay(video);
    }

    // ---------- Modos de repeticion ----------
    var LOOP_LABELS = {
      off: 'Repeat: off (L)',
      one: 'Repeat: current video (L)',
      all: 'Repeat: entire playlist (L)'
    };

    // El bucle se resuelde en el evento 'ended' porque la propiedad
    // video.loop se comporta de forma inconsistente en motores antiguos.
    function setLoopMode(mode) {
      state.loopMode = mode;
      toggleClass(el.loopBtn, 'on', mode === 'one');       // cambia al icono "repeat one"
      toggleClass(el.loopBtn, 'active', mode !== 'off');   // resalta el boton si hay repeticion
      el.loopBtn.setAttribute('aria-pressed', String(mode !== 'off'));
      el.loopBtn.title = LOOP_LABELS[mode] || '';
    }

    // Avanza al siguiente modo en la lista loopModes (boton o tecla L)
    function cycleLoopMode() {
      setLoopMode(loopModes[(indexOf(loopModes, state.loopMode) + 1) % loopModes.length]);
    }

    // ---------- Play / pause ----------
    function togglePlay() {
      if (video.paused || video.ended) { safePlay(video); } else { video.pause(); }
    }

    // ---------- Volumen ----------
    // Sincroniza icono de mute y relleno de la barra con el estado real.
    // Si esta silenciado (mute o volumen 0), la barra se pinta vacia.
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
        video.muted = value === 0; // volumen 0 implica silencio
      } catch (err) { log('volume failed:', err); }
      syncVolumeUI();
    }

    function toggleMute() {
      video.muted = !video.muted;
      // Al desilenciar con volumen en 0, se restaura el volumen maximo
      if (!video.muted && video.volume === 0) { video.volume = 1; }
      syncVolumeUI();
    }

    // delta positivo sube volumen, negativo lo baja (flechas sobre la barra)
    function changeVolume(delta) {
      var current = video.muted ? 0 : video.volume;
      setVolume(Math.round((current + delta) * 100) / 100);
    }

    // ---------- Seek (saltos de posicion) ----------
    function seekBy(delta) {
      var duration = video.duration;
      if (typeof duration !== 'number' || !isFinite(duration)) { return; } // sin metadatos aun
      try { video.currentTime = clamp(video.currentTime + delta, 0, duration); } catch (err) { log('seek failed:', err); }
    }

    // ---------- Pantalla completa ----------
    // Estrategia en 3 niveles:
    //   1) API nativa estandar (requestFullscreen)
    //   2) Variantes con prefijo de vendor (webkit/moz/ms)
    //   3) Fallback "pseudo-fullscreen": clase CSS fixed a toda la ventana
    function getFullscreenElement() {
      return document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement || null;
    }

    // Refleja el estado de fullscreen en la UI (clase del contenedor e icono)
    function syncFullscreenUI() {
      var full = !!getFullscreenElement() || state.pseudoFs;
      toggleClass(el.videoContainer, 'is-fullscreen', full);
      toggleClass(el.fullscreenBtn, 'on', full);
    }

    function setPseudoFullscreen(enabled) {
      state.pseudoFs = enabled;
      toggleClass(el.videoContainer, 'pseudo-fullscreen', enabled);
      // Sin scroll para que la barra del navegador no estorbe
      document.body.style.overflow = enabled ? 'hidden' : '';
      syncFullscreenUI();
    }

    function isFullscreen() {
      return !!getFullscreenElement() || state.pseudoFs;
    }

    // Punto unico de entrada para F / boton / tecla Back
    function toggleFullscreen() {
      var box = el.videoContainer;

      // 1) Si estamos en fallback CSS, solo hay que quitar la clase
      if (state.pseudoFs) { setPseudoFullscreen(false); return; }

      // 2) Si ya hay fullscreen nativo, salir de el
      if (getFullscreenElement()) {
        var exit = document.exitFullscreen || document.webkitExitFullscreen ||
          document.webkitCancelFullScreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exit) { try { exit.call(document); } catch (err) { log(err); } }
        return;
      }

      // 3) Pedir fullscreen nativo (cualquier variante disponible)
      var request = box.requestFullscreen || box.webkitRequestFullscreen ||
        box.webkitRequestFullScreen || box.mozRequestFullScreen || box.msRequestFullscreen;
      if (!request) { setPseudoFullscreen(true); return; } // sin API: fallback CSS

      // Algunas implementaciones devuelven Promise y rechazan si el navegador
      // bloquea el fullscreen: en ese caso caemos al fallback
      try {
        var result = request.call(box);
        if (result && typeof result.then === 'function') {
          result.then(null, function () { setPseudoFullscreen(true); });
        }
      } catch (err) {
        setPseudoFullscreen(true);
      }
    }

    // ---------- Auto-ocultado de controles ----------
    // JS activa/desactiva la clase "user-inactive"; el CSS se encarga de
    // desvanecer la barra de controles.
    function setInactive(inactive) { toggleClass(el.videoContainer, 'user-inactive', inactive); }
    function hideIfPlaying() { if (!video.paused) { setInactive(true); } }

    function showControls() {
      setInactive(false);
      clearTimeout(state.hideTimer);
      state.hideTimer = setTimeout(hideIfPlaying, CONTROLS_HIDE_MS);
    }

    // ---------- Cableado de raton / clic ----------
    // Pares [elemento, accion] registrados de golpe con el helper 'each'
    each([
      [el.playPauseBtn, togglePlay],
      [el.videoOverlay, togglePlay],
      [el.bigPlayBtn, togglePlay],
      [el.prevBtn, playPrevious],
      [el.nextBtn, playNext],
      [el.retryBtn, function () { loadVideo(state.index, false); }], // reintenta sin autoplay
      [el.loopBtn, cycleLoopMode],
      [el.muteBtn, toggleMute],
      [el.fullscreenBtn, toggleFullscreen]
    ], function (pair) { on(pair[0], 'click', pair[1]); });

    // Clic en la barra de volumen: el volumen pasa a ser el punto tocado
    on(el.volumeBar, 'click', function (e) {
      setVolume(fractionInBar(e || window.event, el.volumeBar));
    });

    // Clic en la barra de progreso: salta a la fraccion tocada del video
    on(el.progressContainer, 'click', function (e) {
      var duration = video.duration;
      if (typeof duration !== 'number' || !isFinite(duration) || !duration) { return; }
      try { video.currentTime = fractionInBar(e || window.event, el.progressContainer) * duration; } catch (err) { log(err); }
    });

    // Movimiento del raton = actividad: mostrar controles (y reprogramar ocultado)
    on(el.videoContainer, 'mousemove', showControls);
    on(el.videoContainer, 'mouseleave', hideIfPlaying);

    // ---------- Eventos del <video> ----------
    onMany(video, 'volumechange', syncVolumeUI);

    on(video, 'play', function () {
      addClass(el.playPauseBtn, 'on');   // icono pasa a "pausa"
      setHidden(el.bigPlayBtn, true);
      showControls();                    // arranca la cuenta regresiva de ocultado
    });

    on(video, 'pause', function () {
      removeClass(el.playPauseBtn, 'on'); // icono vuelve a "play"
      // Al pausar (sin haber terminado ni estar en error) reaparece el boton grande
      if (!video.ended && hasClass(el.errorMessage, 'hidden')) { setHidden(el.bigPlayBtn, false); }
      clearTimeout(state.hideTimer);
      setInactive(false);                // controles siempre visibles en pausa
    });

    // "waiting" = el video se quedo sin datos y esta rebufferizando
    on(video, 'waiting', function () { setHidden(el.spinner, false); });
    // Cualquiera de estos eventos significa que ya hay datos que mostrar
    onMany(video, 'canplay playing loadeddata loadedmetadata', function () { setHidden(el.spinner, true); });
    // Metadatos listos: ya conocemos la duracion total
    on(video, 'loadedmetadata', function () { el.duration.textContent = formatTime(video.duration); });
    on(video, 'durationchange', function () { el.duration.textContent = formatTime(video.duration); });

    on(video, 'timeupdate', function () {
      var duration = video.duration;
      if (typeof duration !== 'number' || !isFinite(duration) || !duration) { return; }
      // Rellena la barra de progreso en porcentaje
      el.progressBar.style.width = ((video.currentTime / duration) * 100) + '%';

      // Optimizacion para TVs lentas: solo se toca el texto del reloj cuando
      // cambia el segundo visible, no en cada tick del evento.
      var second = Math.floor(video.currentTime);
      if (second !== state.shownSecond) {
        state.shownSecond = second;
        el.currentTime.textContent = formatTime(video.currentTime);
      }
    });

    // Rellena la barra de buffer con el porcentaje ya descargado
    on(video, 'progress', function () {
      var duration = video.duration;
      if (duration && video.buffered && video.buffered.length) {
        try {
          el.bufferBar.style.width = ((video.buffered.end(video.buffered.length - 1) / duration) * 100) + '%';
        } catch (err) { /* los rangos de buffer pueden cambiar mientras se leen */ }
      }
    });

    // Error de carga: marca la tarjeta como Unavailable y muestra el overlay
    on(video, 'error', function () {
      playlist.setUnavailable(state.index, true);
      refreshPlaylist();
      setHidden(el.spinner, true);
      setHidden(el.bigPlayBtn, true);
      setHidden(el.errorMessage, false);
      try { el.retryBtn.focus(); } catch (err) { /* ignorar */ }
    });

    // Fin del video: decide que hacer segun el modo de repeticion / autoplay
    on(video, 'ended', function () {
      var isLast = state.index === VIDEOS.length - 1;

      if (state.loopMode === 'one') { restartCurrent(); return; }
      if (state.loopMode === 'all') {
        if (VIDEOS.length === 1) { restartCurrent(); } else { playNext(); } // loadVideo() envuelve solo
        return;
      }
      // loopMode 'off': solo avanza si el toggle "Autoplay next" esta activo
      if (el.autoplayNext.checked && !isLast && VIDEOS.length > 1) {
        playNext();
      } else {
        setHidden(el.bigPlayBtn, false);
        setInactive(false);
      }
    });

    // Cualquier cambio de fullscreen (nativo, de cualquier vendor) resincroniza la UI
    onMany(document, 'fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', syncFullscreenUI);

    // ---------- Navegacion de foco (mando / teclado) ----------
    // Determina si un elemento es visible (para excluir los ocultos de las
    // filas de navegacion). offsetWidth/Height > 0 es el test clasico.
    function isShown(node) {
      return !!node && !hasClass(node, 'hidden') && (node.offsetWidth > 0 || node.offsetHeight > 0);
    }

    function filterShown(list) {
      var out = [];
      each(list, function (node) { if (isShown(node)) { out.push(node); } });
      return out;
    }

    // Filas de elementos enfocables, de arriba abajo. Las tarjetas de la
    // lista se AGRUPAN por fila visual segun su posicion en pantalla, asi
    // una cuadricula de varias columnas se navega tal como se ve.
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
        // Si el borde superior difiere > 4px, es una fila nueva
        if (current === null || Math.abs(top - currentTop) > 4) {
          current = [];
          currentTop = top;
          rows.push(current);
        }
        current.push(btn);
      });
      return rows;
    }

    // Centro horizontal de un elemento: referencia para mover el foco
    // "hacia donde apunta" el usuario al cambiar de fila
    function centerX(node) {
      var rect = node.getBoundingClientRect();
      return rect.left + (rect.width || node.offsetWidth) / 2;
    }

    function focusNode(node) {
      try { node.focus(); } catch (err) { log(err); }
    }

    // Ubica un nodo dentro de la matriz de filas: { fila, columna }
    function locate(rows, node) {
      for (var r = 0; r < rows.length; r++) {
        for (var c = 0; c < rows[r].length; c++) {
          if (rows[r][c] === node) { return { row: r, col: c }; }
        }
      }
      return null;
    }

    // Movimiento espacial del foco (left/right/up/down desde el D-pad)
    function moveFocus(direction) {
      var rows = getNavRows();
      var pos = locate(rows, document.activeElement);

      // Si el foco esta fuera del reproductor (p. ej. tras un clic fuera),
      // se recupera enfocando el contenedor del video
      if (!pos) { focusNode(el.videoContainer); return; }

      // Izquierda/derecha: moverse dentro de la misma fila
      if (direction === 'left' || direction === 'right') {
        var target = rows[pos.row][pos.col + (direction === 'left' ? -1 : 1)];
        if (target) { focusNode(target); }
        return;
      }

      // Arriba/abajo: subir o bajar una fila (saltandose filas vacias)
      var step = direction === 'up' ? -1 : 1;
      var r = pos.row + step;
      while (rows[r] && rows[r].length === 0) { r += step; }
      if (!rows[r]) { return; }

      // Dentro de la fila destino se elige el elemento cuyo centro
      // horizontal este MAS CERCA del elemento actual: la navegacion sigue
      // la disposicion en pantalla en vez de un indice fijo.
      var fromX = centerX(document.activeElement);
      var best = rows[r][0];
      var bestDist = Math.abs(centerX(best) - fromX);
      for (var i = 1; i < rows[r].length; i++) {
        var dist = Math.abs(centerX(rows[r][i]) - fromX);
        if (dist < bestDist) { best = rows[r][i]; bestDist = dist; }
      }
      focusNode(best);
    }

    // En Samsung Tizen las teclas multimedia SOLO se entregan a las apps
    // que las registran explicitamente al arrancar; aqui se pide todas
    // las disponibles, ignorando las que la plataforma no soporte.
    function registerTvKeys() {
      try {
        if (window.tizen && window.tizen.tvinputdevice) {
          each(['MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop',
            'MediaRewind', 'MediaFastForward', 'MediaTrackPrevious', 'MediaTrackNext'], function (name) {
              try { window.tizen.tvinputdevice.registerKey(name); } catch (err) { /* tecla no soportada */ }
            });
        }
      } catch (err) { /* no es una TV Tizen */ }
    }

    // Comportamiento de Back / Esc en 3 pasos:
    //   1) Si hay fullscreen (real o pseudo), salir de el
    //   2) Si el foco no esta en el reproductor, devolverlo ahi
    //   3) Si ya estaba en el reproductor, en Tizen se cierra la app
    //      (el resto de plataformas gestiona Back de forma nativa)
    function handleBack() {
      if (isFullscreen()) { toggleFullscreen(); return; }
      if (document.activeElement !== el.videoContainer) { focusNode(el.videoContainer); return; }
      try {
        if (window.tizen && window.tizen.application) { window.tizen.application.getCurrentApplication().exit(); }
      } catch (err) { /* ignorar */ }
    }

    // Manejador central de teclado y mando a distancia
    function onKeyDown(e) {
      e = e || window.event;
      var code = e.keyCode || e.which;
      // No interferir con atajos del navegador/SO (Ctrl, Alt, Cmd)
      if (e.ctrlKey || e.metaKey || e.altKey) { return; }

      var active = document.activeElement;
      var tag = active ? active.tagName : '';
      // "Sobre el reproductor" = nada enfocado, body, o el contenedor mismo;
      // en ese estado las flechas horizontales hacen seek directamente.
      var onPlayer = !active || active === document.body || active === el.videoContainer;
      var onProgress = active === el.progressContainer;
      var onVolume = active === el.volumeBar;
      var handled = true;

      switch (code) {
        case KEY.SPACE:
          // Espacio sobre un boton/input se deja pasar: su comportamiento
          // nativo de "clic" ya hace lo correcto.
          if (tag === 'BUTTON' || tag === 'INPUT') { return; }
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
          // Stop = pausar y volver al inicio del video
          video.pause();
          try { video.currentTime = 0; } catch (err) { /* ignorar */ }
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
            // Foco "general" o en la barra de progreso: flechas = seek 5 s
            seekBy(code === KEY.LEFT ? -SEEK_STEP : SEEK_STEP);
          } else if (onVolume) {
            // Foco en la barra de volumen: flechas = ajustar volumen
            changeVolume(code === KEY.LEFT ? -VOLUME_STEP : VOLUME_STEP);
          } else {
            // Cualquier otro control: navegacion espacial
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
          // Enter contextual segun donde este el foco
          if (onPlayer || onProgress) {
            togglePlay();
          } else if (onVolume) {
            toggleMute();
          } else if (active && active.click) {
            active.click(); // activa el boton/enfoque seleccionado
          } else {
            handled = false;
          }
          break;
        case KEY.TIZEN_BACK:
        case KEY.WEBOS_BACK:
        case KEY.ESC:
          // Esc solo se procesa en pseudo-fullscreen; en fullscreen real
          // ya lo gestiona el navegador de forma nativa.
          if (code === KEY.ESC && !state.pseudoFs) { return; }
          handleBack();
          break;
        default:
          handled = false; // tecla no reconocida: no se intercepta
      }

      if (handled) {
        stop(e);         // evita el scroll/accion por defecto del navegador
        showControls();  // cualquier tecla cuenta como actividad del usuario
      }
    }

    on(document, 'keydown', onKeyDown);

    // ---------- Arranque ----------
    // Con un solo video no tiene sentido cambiar de pista ni autoplay-next:
    // se ocultan prev/next y el toggle.
    var hasMultiple = VIDEOS.length > 1;
    each([el.prevBtn, el.nextBtn, el.autoplayLabel], function (node) { setHidden(node, !hasMultiple); });
    setHidden(el.loopBtn, !PLAYER_SETTINGS.showLoopButton);
    registerTvKeys();
    setLoopMode(state.loopMode);
    syncVolumeUI();
    syncFullscreenUI();
    loadVideo(0, false);              // carga el primer video SIN reproducir
    focusNode(el.videoContainer);     // las flechas del mando ya hacen seek
  }

  init();
}());
