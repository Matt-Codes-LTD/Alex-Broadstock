// Project.js – rewritten for reliability & performance
(function () {
  if (window.__projectInit) return;
  window.__projectInit = true;

  document.addEventListener("DOMContentLoaded", () => {
    const wrap = document.querySelector(".project-player_wrap");
    if (!wrap) return;

    const video = wrap.querySelector(".project-player_video");
    if (!video) return;

    const poster = wrap.querySelector(".video_poster");

    // --- 1. Poster handling ---
    const hidePoster = () => {
      if (poster && poster.parentNode) {
        poster.style.opacity = "0";
        poster.style.transition = "opacity .3s ease";
        setTimeout(() => poster.remove(), 400);
      }
    };

    // Hide poster as soon as the video is ready
    video.addEventListener("loadeddata", hidePoster, { once: true });
    video.addEventListener("playing", hidePoster, { once: true });

    // --- 2. Autoplay reliability ---
    const tryAutoplay = () => {
      video.play().catch(() => {
        // Autoplay failed (iOS Safari etc.)
        // Show play button as fallback
        wrap.classList.add("is-paused");
      });
    };

    if (video.readyState >= 2) {
      // Already buffered enough
      tryAutoplay();
    } else {
      video.addEventListener("loadeddata", tryAutoplay, { once: true });
    }

    // --- 3. Controls ---
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
      const seek = (e) => {
        const rect = timeline.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        video.currentTime = percent * video.duration;
      };
      timeline.addEventListener("click", seek);
    }

    // --- 4. Idle state (hide controls) ---
    let idleTimer;
    const setIdle = (state) => wrap.dataset.idle = state ? "1" : "0";

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
