// state.js
export function createState(wrap, video, btnPlay, btnMute, muteLabel, btnFS, centerBtn) {
  let hidingTO = 0;

  const setPlayUI = (isPlaying) => {
    btnPlay?.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    btnPlay?.classList.toggle("is-playing", isPlaying);
    if (centerBtn.classList.contains("is-mode-play")) {
      centerBtn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
      centerBtn.classList.toggle("is-playing", isPlaying);
    }
  };

  const setMuteUI = (muted) => {
    if (btnMute) {
      btnMute.setAttribute("aria-pressed", muted ? "true" : "false");
      if (muteLabel) muteLabel.textContent = muted ? "Sound" : "Mute";
      else btnMute.textContent = muted ? "Sound" : "Mute";
    }
  };

  const setPausedUI = (paused) => wrap.classList.toggle("is-paused", !!paused);
  const setIdle = (on) => { wrap.dataset.idle = on ? "1" : "0"; };

  const kickHide = () => {
    clearTimeout(hidingTO);
    setIdle(false);
    hidingTO = setTimeout(() => setIdle(true), 1800);
  };

  function updateFSLabel() {
    if (!btnFS) return;
    const inFS = !!document.fullscreenElement &&
      (document.fullscreenElement === wrap || wrap.contains(document.fullscreenElement));
    btnFS.textContent = inFS ? "Minimise" : "Fullscreen";
    btnFS.setAttribute("aria-label", inFS ? "Exit fullscreen" : "Toggle fullscreen");
  }

  return { setPlayUI, setMuteUI, setPausedUI, kickHide, updateFSLabel };
}
