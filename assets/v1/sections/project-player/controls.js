import { setPlayUI, setMuteUI, setPausedUI, switchCenterToPlayMode } from "./utils.js";

export function initControls(video, wrap, centerBtn, state) {
  const btnPlay = wrap.querySelector('[data-role="play"]');
  const btnMute = wrap.querySelector('[data-role="mute"]');
  const muteLabel = wrap.querySelector('[data-role="mute-label"]');
  const btnFS = wrap.querySelector('[data-role="fs"]');

  // Play/Pause
  async function togglePlayFromUser() {
    try {
      if (video.paused) {
        if (video.muted || video.volume === 0) {
          video.muted = false;
          video.removeAttribute("muted");
          video.volume = Number(localStorage.getItem("pp:vol") || 1) || 1;
          setMuteUI(btnMute, muteLabel, false);
          state.didFirstSoundRestart = true;
        }
        await video.play();
      } else {
        await video.pause();
      }
    } catch {}
    setPlayUI(video, btnPlay, centerBtn, !video.paused);
    setPausedUI(wrap, video.paused);
    state.kickHide();
  }

  btnPlay?.addEventListener("click", togglePlayFromUser);
  state.handlers.push(() => btnPlay?.removeEventListener("click", togglePlayFromUser));

  // Center button
  const centerHandler = async () => {
    const inPlayMode = centerBtn.classList.contains("is-mode-play");
    if (!inPlayMode) {
      try {
        video.muted = false;
        video.removeAttribute("muted");
        video.volume = Number(localStorage.getItem("pp:vol") || 1) || 1;
        video.currentTime = 0;
        await video.play?.();
        switchCenterToPlayMode(centerBtn, video);
        setMuteUI(btnMute, muteLabel, false);
        setPlayUI(video, btnPlay, centerBtn, true);
        setPausedUI(wrap, false);
        state.didFirstSoundRestart = true;
      } catch {}
      state.kickHide();
      return;
    }
    await togglePlayFromUser();
  };
  centerBtn.addEventListener("click", centerHandler);
  state.handlers.push(() => centerBtn.removeEventListener("click", centerHandler));

  // Mute
  const muteHandler = async () => {
    const wasMuted = video.muted;
    video.muted = !video.muted;
    if (video.muted) {
      video.setAttribute("muted", "");
    } else {
      video.removeAttribute("muted");
      if (video.volume === 0) video.volume = Number(localStorage.getItem("pp:vol") || 1) || 1;
      if (wasMuted && !state.didFirstSoundRestart) {
        state.didFirstSoundRestart = true;
        video.currentTime = 0;
        await video.play?.();
        setPlayUI(video, btnPlay, centerBtn, true);
        setPausedUI(wrap, false);
        switchCenterToPlayMode(centerBtn, video);
      }
    }
    localStorage.setItem("pp:muted", video.muted ? "1" : "0");
    setMuteUI(btnMute, muteLabel, video.muted);
    state.kickHide();
  };
  btnMute?.addEventListener("click", muteHandler);
  state.handlers.push(() => btnMute?.removeEventListener("click", muteHandler));

  // Fullscreen
  function updateFSLabel() {
    if (!btnFS) return;
    const inFS =
      !!document.fullscreenElement &&
      (document.fullscreenElement === wrap || wrap.contains(document.fullscreenElement));
    btnFS.textContent = inFS ? "Minimise" : "Fullscreen";
    btnFS.setAttribute("aria-label", inFS ? "Exit fullscreen" : "Toggle fullscreen");
  }
  document.addEventListener("fullscreenchange", updateFSLabel);
  state.handlers.push(() => document.removeEventListener("fullscreenchange", updateFSLabel));

  btnFS?.addEventListener("click", async () => {
    try {
      !document.fullscreenElement
        ? await wrap.requestFullscreen?.()
        : await document.exitFullscreen?.();
    } catch {}
    state.kickHide();
  });
  state.handlers.push(() => btnFS?.removeEventListener("click", () => {}));

  return () => {};
}
