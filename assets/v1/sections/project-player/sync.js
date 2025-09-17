import { setPlayUI, setPausedUI } from "./utils.js";

export function initSync(video, wrap, state) {
  const btnPlay = wrap.querySelector('[data-role="play"]');
  const centerBtn = wrap.querySelector(".project-player_center-toggle");

  video.addEventListener("play", () => {
    setPlayUI(video, btnPlay, centerBtn, true);
    setPausedUI(wrap, false);
  });
  video.addEventListener("playing", () => setPausedUI(wrap, false));
  video.addEventListener("pause", () => {
    setPlayUI(video, btnPlay, centerBtn, false);
    setPausedUI(wrap, true);
  });
  video.addEventListener("ended", () => {
    setPlayUI(video, btnPlay, centerBtn, false);
    setPausedUI(wrap, true);
  });

  // Idle hide/show - works immediately
  ["mousemove", "pointermove", "touchstart", "keydown"].forEach((evt) => {
    const fn = () => state.kickHide();
    wrap.addEventListener(evt, fn, { passive: true });
    state.handlers.push(() => wrap.removeEventListener(evt, fn));
  });
  
  // Start idle timer on load
  state.kickHide();

  return () => {};
}