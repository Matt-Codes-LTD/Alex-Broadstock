// Project.js – simplified (no poster images)
(function () {
  if (window.__projectInit) return;
  window.__projectInit = true;

  document.addEventListener("DOMContentLoaded", () => {
    const wrap = document.querySelector(".project-player_wrap");
    if (!wrap) return;

    const video = wrap.querySelector(".project-player_video");
    if (!video) return;

    // --- 1. Autoplay reliability ---
    const tryAutoplay = () => {
      video.play().catch(() => {
        wrap.classList.add("is-paused"); // fallback for iOS Safari
      });
    };

    if (video.readyState >= 2) {
      tryAutoplay();
    } else {
      video.addEventListener("loadeddata", tryAutoplay, { once: true });
    }

    // --- 2. Controls ---
    const playBtn = wrap.querySelector('[data-role="play"]');
    const muteBtn = wrap.querySelector('[data-role="mute"]');
    const fsBtn = wrap.querySelector('[data-role="fs"]');
    const timeline = wrap.querySelector('[data-role="timeline"]');

    if (playBtn) {
      playBtn.addEventListener("click", () => {
        if (video.paused) {
          video.play();
          playBtn.classList.add("is-playing");
          wrap.classList.remove("is-paused");
        } else {
          video.pause();
          playBtn.classList.remove("is-playing");
          wrap.classList.add("is-paused");
        }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        video.muted = !video.muted;
        muteBtn.setAttribute("aria-pressed", String(!video.muted));
      });
    }

    if (fsBtn) {
      fsBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
          wrap.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      });
    }

    if (timeline) {
      const bufferEl = timeline.querySelector(".project-player_timeline-buffer");
      const handle = timeline.querySelector(".project-player_timeline-handle");

      // Update timeline buffer + position
      video.addEventListener("timeupdate", () => {
        const progress = (video.currentTime / video.duration) * 100 || 0;
        handle.style.left = progress + "%";
      });

      video.addEventListener("progress", () => {
        if (video.buffered.length) {
          const end = video.buffered.end(video.buffered.length - 1);
          const percent = (end / video.duration) * 100;
          bufferEl.style.width = percent + "%";
        }
      });

      // Seek
      timeline.addEventListener("click", (e) => {
        const rect = timeline.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        video.currentTime = percent * video.duration;
      });
    }

    // --- 3. Idle state (hide controls) ---
    let idleTimer;
    const setIdle = (state) => (wrap.dataset.idle = state ? "1" : "0");

    const resetIdle = () => {
      setIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIdle(true), 2500);
    };

    ["mousemove", "click", "keydown"].forEach((evt) => {
      wrap.addEventListener(evt, resetIdle);
    });

    resetIdle();
  });
})();
