export function setPlayUI(video, btnPlay, centerBtn, isPlaying) {
  const pressed = isPlaying ? "true" : "false";
  btnPlay?.setAttribute("aria-pressed", pressed);
  btnPlay?.classList.toggle("is-playing", isPlaying);
  if (centerBtn.classList.contains("is-mode-play")) {
    centerBtn.setAttribute("aria-pressed", pressed);
    centerBtn.classList.toggle("is-playing", isPlaying);
  }
}

export function setMuteUI(btnMute, muteLabel, muted) {
  if (btnMute) {
    btnMute.setAttribute("aria-pressed", muted ? "true" : "false");
    if (muteLabel) muteLabel.textContent = muted ? "Sound" : "Mute";
    else btnMute.textContent = muted ? "Sound" : "Mute";
  }
}

export function setPausedUI(wrap, paused) {
  wrap.classList.toggle("is-paused", !!paused);
}

export function switchCenterToPlayMode(centerBtn, video) {
  centerBtn.classList.add("is-mode-play");
  centerBtn.setAttribute("aria-label", "Play/Pause");
  const isPlaying = !video.paused;
  centerBtn.classList.toggle("is-playing", isPlaying);
  centerBtn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
}
