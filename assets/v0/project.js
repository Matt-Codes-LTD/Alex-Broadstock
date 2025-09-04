// https://alex-static-cdn.b-cdn.net/assets/live/v0/project.js
(function () {
  function preconnectFor(src) {
    try {
      const { origin } = new URL(src, location.href);
      const head = document.head;
      const exists = [...head.querySelectorAll('link[rel="preconnect"],link[rel="dns-prefetch"]')]
        .some(l => (l.href || '').startsWith(origin));
      if (!exists) {
        const p = document.createElement('link');
        p.rel = 'preconnect'; p.href = origin; p.crossOrigin = 'anonymous'; head.appendChild(p);
        const d = document.createElement('link');
        d.rel = 'dns-prefetch'; d.href = origin; head.appendChild(d);
      }
    } catch (e) {}
  }

  function ProjectInit(container) {
    const wrap = (container || document).querySelector('.project-player_wrap');
    if (!wrap || wrap.dataset.scriptInitialized) return;
    wrap.dataset.scriptInitialized = '1';

    const video = wrap.querySelector('video');
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.autoplay = true;
    video.play?.().catch(() => {});
    preconnectFor(video.currentSrc || video.src);

    // Idle UI
    let idle = null;
    function bump() {
      wrap.dataset.idle = '0';
      clearTimeout(idle);
      idle = setTimeout(() => (wrap.dataset.idle = '1'), 3000);
    }
    ['mousemove','keydown','click','touchstart'].forEach(evt =>
      wrap.addEventListener(evt, bump, { passive: true })
    );
    bump();

    // Basic play/pause + mute toggles (if present)
    const playBtn = wrap.querySelector('[data-role="play"]');
    const muteBtn = wrap.querySelector('[data-role="mute"]');
    const center  = wrap.querySelector('.project-player_center-toggle');

    function syncPlayState() {
      const playing = !video.paused;
      playBtn?.classList.toggle('is-playing', playing);
      center?.classList.toggle('is-playing', playing);
      center?.classList.toggle('is-mode-play', true); // switch from sound to play mode after first interaction
    }

    playBtn?.addEventListener('click', () => {
      if (video.paused) video.play().catch(()=>{}); else video.pause();
      syncPlayState();
    });

    center?.addEventListener('click', () => {
      if (video.muted) {
        video.muted = false;
        center.setAttribute('aria-label','Play/Pause');
      } else {
        if (video.paused) video.play().catch(()=>{}); else video.pause();
      }
      syncPlayState();
    });

    muteBtn?.addEventListener('click', () => {
      video.muted = !video.muted;
      muteBtn.setAttribute('aria-pressed', String(!video.muted));
      const lbl = muteBtn.querySelector('[data-role="mute-label"]');
      if (lbl) lbl.textContent = video.muted ? 'Sound' : 'Mute';
    });

    video.addEventListener('play',  syncPlayState);
    video.addEventListener('pause', syncPlayState);
  }

  window.ProjectInit = ProjectInit;
})();
