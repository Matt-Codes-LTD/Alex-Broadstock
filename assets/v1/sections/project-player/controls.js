// controls.js
export function initControls({ wrap, video, btnPlay, btnMute, muteLabel, btnFS, centerBtn, tl, state }) {
  const handlers = [];

  async function togglePlayFromUser() {
    try {
      if (video.paused) {
        if (video.muted || video.volume === 0) {
          video.muted = false; video.removeAttribute("muted");
          video.volume = Number(localStorage.getItem("pp:vol") || 1) || 1;
          state.setMuteUI(false);
        }
        await video.play();
      } else await video.pause();
    } catch {}
    state.setPlayUI(!video.paused);
    state.setPausedUI(video.paused);
    state.kickHide();
  }

  btnPlay?.addEventListener("click", togglePlayFromUser);
  handlers.push(() => btnPlay?.removeEventListener("click", togglePlayFromUser));

  centerBtn.addEventListener("click", async () => {
    const inPlayMode = centerBtn.classList.contains("is-mode-play");
    if (!inPlayMode) {
      try {
        video.muted = false; video.removeAttribute("muted");
        video.volume = Number(localStorage.getItem("pp:vol") || 1) || 1;
        video.currentTime = 0;
        await video.play?.();
        centerBtn.classList.add("is-mode-play");
        state.setMuteUI(false);
        state.setPlayUI(true);
        state.setPausedUI(false);
      } catch {}
      state.kickHide();
      return;
    }
    await togglePlayFromUser();
  });
  handlers.push(() => centerBtn.removeEventListener("click", togglePlayFromUser));

  btnMute?.addEventListener("click", async () => {
    video.muted = !video.muted;
    video.muted ? video.setAttribute("muted", "") : video.removeAttribute("muted");
    localStorage.setItem("pp:muted", video.muted ? "1" : "0");
    state.setMuteUI(video.muted);
    state.kickHide();
  });
  handlers.push(() => btnMute?.removeEventListener("click", () => {}));

  btnFS?.addEventListener("click", async () => {
    try { !document.fullscreenElement ? await wrap.requestFullscreen?.() : await document.exitFullscreen?.(); } catch {}
    state.kickHide();
  });
  handlers.push(() => btnFS?.removeEventListener("click", () => {}));

  if (tl) {
    const onDown = (e) => {
      const r = tl.getBoundingClientRect();
      const pct = ((e.clientX - r.left) / r.width) * 100;
      video.currentTime = (pct / 100) * video.duration;
      state.kickHide();
    };
    tl.addEventListener("pointerdown", onDown);
    handlers.push(() => tl.removeEventListener("pointerdown", onDown));
  }

  return handlers;
}
