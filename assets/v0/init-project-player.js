/* =========================
   PROJECT PLAYER (full legacy, per container)
========================= */
function initProjectPlayer(container) {
  const wrap = container.querySelector(".project-player_wrap");
  if (!wrap) return () => {};
  if (wrap.dataset.scriptInitialized) return () => {};
  wrap.dataset.scriptInitialized = "true";

  // ✅ Force visible immediately (overrides CSS opacity:0 at first paint)
  const controlsEl = wrap.querySelector(".project-player_controls");
  const btnMuteEl  = wrap.querySelector('[data-role="mute"]');
  const centerBtnEl = wrap.querySelector(".project-player_center-toggle");
  gsap.set([wrap, controlsEl, btnMuteEl, centerBtnEl], { opacity: 1 });

  const stage  = wrap.querySelector(".project-player_stage") || wrap;
  const slug   = stage.getAttribute("data-project-slug") || wrap.getAttribute("data-project-slug") || "";
  const url    = stage.getAttribute("data-video")        || wrap.getAttribute("data-video")        || "";
  const vtt    = stage.getAttribute("data-captions")     || wrap.getAttribute("data-captions")     || "";
  const poster = stage.getAttribute("data-poster")       || wrap.getAttribute("data-poster")       || "";
  const host   = stage.querySelector(".project-player_video-host") || wrap.querySelector(".project-player_video-host");

  // Controls
  const btnPlay   = wrap.querySelector('[data-role="play"]');
  const btnMute   = btnMuteEl;
  const muteLabel = wrap.querySelector('[data-role="mute-label"]');
  const btnFS     = wrap.querySelector('[data-role="fs"]');
  const tl        = wrap.querySelector('[data-role="timeline"]');
  const tlBuf     = wrap.querySelector(".project-player_timeline-buffer");
  const tlHandle  = wrap.querySelector(".project-player_timeline-handle");

  // Pause overlay
  let pauseFx = wrap.querySelector(".project-player_pausefx");
  if (!pauseFx) {
    pauseFx = document.createElement("div");
    pauseFx.className = "project-player_pausefx u-cover-absolute u-inset-0";
    const afterTarget = (wrap.querySelector(".project-player_stage") || wrap).querySelector(".project-player_video-host");
    const target = wrap.querySelector(".project-player_stage") || wrap;
    afterTarget?.nextSibling
      ? target.insertBefore(pauseFx, afterTarget.nextSibling)
      : target.appendChild(pauseFx);
  }

  // Center overlay
  let centerBtn = centerBtnEl;
  if (!centerBtn) {
    centerBtn = document.createElement("button");
    centerBtn.className =
      "project-player_center-toggle project-player_btn project-player_btn--play";
    centerBtn.type = "button";
    centerBtn.setAttribute("aria-pressed", "false");
    centerBtn.setAttribute("aria-label", "Unmute");
    centerBtn.style.color = "#fff";
    centerBtn.innerHTML = `
      <svg viewBox="0 0 24 24" class="pp-icon" aria-hidden="true" fill="none">
        <g class="pp-icon--group pp-icon--sound">
          <path d="M12 5V19L7 16H2V8H7L12 5Z"></path>
          <path d="M19.3 19.3C21.0459 17.2685 22.0059 14.6786 22.0059 12C22.0059 9.3214 21.0459 6.73148 19.3 4.70001"></path>
          <path d="M16.4 16.4C17.4429 15.1711 18.0154 13.6118 18.0154 12C18.0154 10.3882 17.4429 8.82888 16.4 7.60001"></path>
        </g>
        <g class="pp-icon--group pp-icon--play">
          <g class="pp-icon__part pp-icon__play">
            <path d="M5.2 12V3L13 7.5L20.8 12L13 16.5L5.2 21V12Z"></path>
          </g>
          <g class="pp-icon__part pp-icon__pause">
            <path d="M9.5 5.5H6.5V18.5H9.5V5.5Z"></path>
            <path d="M17.5 5.5H14.5V18.5H17.5V5.5Z"></path>
          </g>
        </g>
      </svg>
      <span class="u-sr-only">Unmute</span>
    `.trim();
    (wrap.querySelector(".project-player_stage") || wrap).appendChild(centerBtn);
  }

  // (video element setup, event handlers, etc... unchanged)

  // --- Start pipeline ---
  (async function () {
    await ensureFirstFramePainted(video);
    try { await video.play(); } catch (_) {}
    setPlayUI(!video.paused);
    setPausedUI(video.paused);

    centerBtn.classList.remove("is-mode-play");
    centerBtn.setAttribute("aria-label", "Unmute");
    setMuteUI(true);

    requestAnimationFrame(() => requestAnimationFrame(() => updateTimeUI()));
    raf = requestAnimationFrame(loop);
    updateFSLabel();

    // 🎬 Intro UI animations
    const controlsBar = wrap.querySelector(".project-player_controls");
    const introTl = gsap.timeline({ onComplete: () => { kickHide(); } });

    if (controlsBar) {
      introTl.fromTo(controlsBar,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        0
      );
    }
    if (btnMute) {
      introTl.fromTo(btnMute,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power2.out" },
        0.2
      );
    }
    if (centerBtn) {
      introTl.fromTo(centerBtn,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" },
        0.1
      );
    }
  })();

  // (rest of function unchanged)
}
