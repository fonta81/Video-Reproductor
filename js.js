document.addEventListener('DOMContentLoaded', () => {
  const videoContainer = document.getElementById('videoContainer');
  const mainVideo = document.getElementById('mainVideo');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const bigPlayBtn = document.getElementById('bigPlayBtn');
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

  // Sample videos: if one fails to load, the player tries the next one
  const sampleVideos = [
    'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4'
  ];
  let currentSourceIndex = 0;

  let hideControlsTimeout;

  // Convert seconds to mm:ss
  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // ---------- Loading a sample video ----------
  function loadSource(index) {
    currentSourceIndex = index;
    errorMessage.classList.add('hidden');
    spinner.classList.remove('hidden');
    mainVideo.src = sampleVideos[index];
    mainVideo.load();
  }

  mainVideo.addEventListener('error', () => {
    if (currentSourceIndex < sampleVideos.length - 1) {
      // Try the next sample video
      loadSource(currentSourceIndex + 1);
    } else {
      // All sources failed
      spinner.classList.add('hidden');
      bigPlayBtn.classList.add('hidden');
      errorMessage.classList.remove('hidden');
    }
  });

  retryBtn.addEventListener('click', () => {
    bigPlayBtn.classList.remove('hidden');
    loadSource(0);
  });

  // ---------- Play / Pause ----------
  function togglePlay() {
    if (mainVideo.paused || mainVideo.ended) {
      const playPromise = mainVideo.play();
      // play() returns a promise; catch it so blocked playback doesn't throw errors
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
    if (!mainVideo.ended) {
      bigPlayBtn.classList.remove('hidden');
    }
    videoContainer.classList.remove('user-inactive');
  });

  mainVideo.addEventListener('ended', () => {
    bigPlayBtn.classList.remove('hidden');
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
    if (document.activeElement.tagName === 'INPUT') return;

    switch (e.key.toLowerCase()) {
      case ' ':
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

  // Start loading the first sample video
  loadSource(0);
});
