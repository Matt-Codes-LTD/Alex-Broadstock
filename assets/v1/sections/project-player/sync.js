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

  // Idle hide/show - ONLY after sound button clicked
  ["mousemove", "pointermove", "touchstart", "keydown"].forEach((evt) => {
    const fn = () => {
      // Only kick hide timer if user has clicked the sound button
      if (state.didFirstSoundRestart) {
        state.kickHide();
      }
    };
    wrap.addEventListener(evt, fn, { passive: true });
    state.handlers.push(() => wrap.removeEventListener(evt, fn));
  });
  
  // Don't start idle timer initially - controls stay visible
  // state.kickHide(); // REMOVED

  return () => {};
}