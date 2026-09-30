/* =====================================================================
   VIDEO LIST  -  the only part you need to edit to add/remove videos
   ---------------------------------------------------------------------
   To ADD a video:    copy one object below and change its values.
   To REMOVE a video: delete its object.
   Fields: title (required), src (required), poster (optional thumbnail)
   ===================================================================== */
const VIDEOS = [
  {
    title: 'Ena',
    src: '/home/mteo/Vídeos/Pruebas/ENA.mp4',
    poster: 'https://i.redd.it/what-do-you-call-dream-bbq-ena-v0-6n804b0rr5xe1.gif?width=600&auto=webp&s=9b59d1125c04f6c2b82ce20a01cd9fcfa0dad12b'
  },
  {
    title: 'Elephants Dream',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg'
  },
  {
    title: 'For Bigger Blazes',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg'
  },
  {
    title: 'Sintel',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg'
  },
  {
    title: 'Tears of Steel',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  // ---------- Element references ----------
  const videoContainer = document.getElementById('videoContainer');
  const mainVideo = document.getElementById('mainVideo');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const bigPlayBtn = document.getElementById('bigPlayBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const bufferBar = document.getElementById('bufferBar');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl = document.getElementById('duration');
  const muteBtn = document.getElementById('muteBtn');
  const volumeHighIcon = document.getElementById('volumeHighIcon');
  const volumeMuteIcon = document.getElementById('volumeMuteIcon');
  const volumeSlider = document.getElementById('volumeSlider');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const fullscreenExpandIcon = document.getElementById('fullscreenExpandIcon');
  const fullscreenCompressIcon = document.getElementById('fullscreenCompressIcon');
  const videoOverlay = document.getElementById('videoOverlay');
  const spinner = document.getElementById('spinner');
  const errorMessage = document.getElementById('errorMessage');
  const retryBtn = document.getElementById('retryBtn');
  const videoTitleEl = document.getElementById('videoTitle');
  const playlistEl = document.getElementById('playlist');
  const autoplayNext = document.getElementById('autoplayNext');

  let currentIndex = 0;
  let hideControlsTimeout;
  const playlistButtons = [];

  // Convert seconds to mm:ss
  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // =====================================================================
  //  VIDEO SWITCHER MODULE
  // =====================================================================

  // Build the playlist cards from the VIDEOS array
  function renderPlaylist() {
    playlistEl.innerHTML = '';
    playlistButtons.length = 0;

    VIDEOS.forEach((video, index) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'playlist-item';
      btn.setAttribute('aria-label', `Play ${video.title}`);

      const thumb = document.createElement('img');
      thumb.className = 'playlist-thumb';
      thumb.alt = '';
      thumb.loading = 'lazy';
      if (video.poster) thumb.src = video.poster;

      const info = document.createElement('div');
      info.className = 'playlist-info';

      const title = document.createElement('span');
      title.className = 'playlist-title';
      title.textContent = video.title;

      const status = document.createElement('span');
      status.className = 'playlist-status';

      info.append(title, status);
      btn.append(thumb, info);
      li.appendChild(btn);
      playlistEl.appendChild(li);

      btn.addEventListener('click', () => loadVideo(index, true));
      playlistButtons.push(btn);
    });
  }

  // Highlight the active card and update the title
  function updatePlaylistUI() {
    playlistButtons.forEach((btn, index) => {
      const isActive = index === currentIndex;
      btn.classList.toggle('active', isActive);
      const status = btn.querySelector('.playlist-status');
      if (btn.classList.contains('unavailable')) {
        status.textContent = 'Unavailable';
      } else {
        status.textContent = isActive ? 'Now playing' : '';
      }
    });
    videoTitleEl.textContent = VIDEOS[currentIndex].title;
  }

  // Load a video by its index. If autoplay is true, start playing right away.
  function loadVideo(index, autoplay = false) {
    if (VIDEOS.length === 0) return;

    // Wrap around at both ends of the list
    currentIndex = (index + VIDEOS.length) % VIDEOS.length;
    const video = VIDEOS[currentIndex];

    // Reset the UI
    errorMessage.classList.add('hidden');
    spinner.classList.remove('hidden');
    progressBar.style.width = '0%';
    bufferBar.style.width = '0%';
    currentTimeEl.textContent = '00:00';
    durationEl.textContent = '00:00';
    bigPlayBtn.classList.remove('hidden');

    // Swap the source
    mainVideo.poster = video.poster || '';
    mainVideo.src = video.src;
    mainVideo.load();

    // Clear any previous error mark on this card (allows retrying)
    playlistButtons[currentIndex].classList.remove('unavailable');
    updatePlaylistUI();

    if (autoplay) {
      const playPromise = mainVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.warn('Playback was prevented:', err));
      }
    }
  }

  function playNext() { loadVideo(currentIndex + 1, true); }
  function playPrevious() { loadVideo(currentIndex - 1, true); }

  prevBtn.addEventListener('click', playPrevious);
  nextBtn.addEventListener('click', playNext);

  // Hide the prev/next buttons if there is only one video
  function updateNavVisibility() {
    const hasMultiple = VIDEOS.length > 1;
    prevBtn.classList.toggle('hidden', !hasMultiple);
    nextBtn.classList.toggle('hidden', !hasMultiple);
    autoplayNext.closest('label').classList.toggle('hidden', !hasMultiple);
  }

  // When a video fails to load: mark its card and show the error
  mainVideo.addEventListener('error', () => {
    playlistButtons[currentIndex].classList.add('unavailable');
    updatePlaylistUI();
    spinner.classList.add('hidden');
    bigPlayBtn.classList.add('hidden');
    errorMessage.classList.remove('hidden');
  });

  retryBtn.addEventListener('click', () => loadVideo(currentIndex, false));

  // When a video ends: go to the next one if "Autoplay next" is on
  mainVideo.addEventListener('ended', () => {
    const isLast = currentIndex === VIDEOS.length - 1;
    if (autoplayNext.checked && !isLast) {
      playNext();
    } else {
      bigPlayBtn.classList.remove('hidden');
      videoContainer.classList.remove('user-inactive');
    }
  });

  // =====================================================================
  //  PLAYER CONTROLS
  // =====================================================================

  // ---------- Play / Pause ----------
  function togglePlay() {
    if (mainVideo.paused || mainVideo.ended) {
      const playPromise = mainVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.warn('Playback was prevented:', err));
      }
    } else {
      mainVideo.pause();
    }
  }

  mainVideo.addEventListener('play', () => {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    bigPlayBtn.classList.add('hidden');
  });

  mainVideo.addEventListener('pause', () => {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    if (!mainVideo.ended && errorMessage.classList.contains('hidden')) {
      bigPlayBtn.classList.remove('hidden');
    }
    videoContainer.classList.remove('user-inactive');
  });

  playPauseBtn.addEventListener('click', togglePlay);
  videoOverlay.addEventListener('click', togglePlay);
  bigPlayBtn.addEventListener('click', togglePlay);

  // ---------- Buffering spinner ----------
  mainVideo.addEventListener('waiting', () => spinner.classList.remove('hidden'));
  mainVideo.addEventListener('canplay', () => spinner.classList.add('hidden'));
  mainVideo.addEventListener('playing', () => spinner.classList.add('hidden'));

  // ---------- Progress, buffer and time ----------
  mainVideo.addEventListener('timeupdate', () => {
    if (mainVideo.duration) {
      const percentage = (mainVideo.currentTime / mainVideo.duration) * 100;
      progressBar.style.width = `${percentage}%`;
      currentTimeEl.textContent = formatTime(mainVideo.currentTime);
    }
  });

  mainVideo.addEventListener('progress', () => {
    if (mainVideo.duration && mainVideo.buffered.length > 0) {
      const bufferedEnd = mainVideo.buffered.end(mainVideo.buffered.length - 1);
      bufferBar.style.width = `${(bufferedEnd / mainVideo.duration) * 100}%`;
    }
  });

  mainVideo.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(mainVideo.duration);
    spinner.classList.add('hidden');
  });

  // Seek by clicking the progress bar
  progressContainer.addEventListener('click', (e) => {
    if (!mainVideo.duration) return;
    const rect = progressContainer.getBoundingClientRect();
    const clickPos = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    mainVideo.currentTime = clickPos * mainVideo.duration;
  });

  // ---------- Volume and mute ----------
  function updateVolumeIcon() {
    if (mainVideo.muted || mainVideo.volume === 0) {
      volumeHighIcon.classList.add('hidden');
      volumeMuteIcon.classList.remove('hidden');
    } else {
      volumeHighIcon.classList.remove('hidden');
      volumeMuteIcon.classList.add('hidden');
    }
  }

  volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    mainVideo.volume = val;
    mainVideo.muted = val === 0;
    updateVolumeIcon();
  });

  muteBtn.addEventListener('click', () => {
    mainVideo.muted = !mainVideo.muted;
    if (mainVideo.muted) {
      volumeSlider.value = 0;
    } else {
      if (mainVideo.volume === 0) mainVideo.volume = 1;
      volumeSlider.value = mainVideo.volume;
    }
    updateVolumeIcon();
  });

  // ---------- Fullscreen ----------
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      fullscreenExpandIcon.classList.add('hidden');
      fullscreenCompressIcon.classList.remove('hidden');
    } else {
      fullscreenExpandIcon.classList.remove('hidden');
      fullscreenCompressIcon.classList.add('hidden');
    }
  });

  // ---------- Auto-hide controls after 3 seconds of inactivity ----------
  function showControls() {
    videoContainer.classList.remove('user-inactive');
    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => {
      if (!mainVideo.paused) {
        videoContainer.classList.add('user-inactive');
      }
    }, 3000);
  }

  videoContainer.addEventListener('mousemove', showControls);
  videoContainer.addEventListener('mouseleave', () => {
    if (!mainVideo.paused) {
      videoContainer.classList.add('user-inactive');
    }
  });

  // ---------- Keyboard shortcuts ----------
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT') return;

    switch (e.key.toLowerCase()) {
      case ' ':
        // Let a focused button (e.g. a playlist card) handle Space itself
        if (tag === 'BUTTON') return;
        e.preventDefault();
        togglePlay();
        break;
      case 'k':
        e.preventDefault();
        togglePlay();
        break;
      case 'm':
        muteBtn.click();
        break;
      case 'f':
        fullscreenBtn.click();
        break;
      case 'n':
        playNext();
        break;
      case 'p':
        playPrevious();
        break;
      case 'arrowleft':
        e.preventDefault();
        mainVideo.currentTime = Math.max(0, mainVideo.currentTime - 5);
        break;
      case 'arrowright':
        e.preventDefault();
        mainVideo.currentTime = Math.min(mainVideo.duration || 0, mainVideo.currentTime + 5);
        break;
    }
  });

  // =====================================================================
  //  START
  // =====================================================================
  renderPlaylist();
  updateNavVisibility();
  loadVideo(0, false);
});
