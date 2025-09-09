// index.js
import { ensurePauseOverlay, ensureCenterButton } from "./overlays.js";
import { createState } from "./state.js";
import { initControls } from "./controls.js";
import { startTimelineLoop } from "./timeline-loop.js";
import { ensureFirstFramePainted } from "./preload.js";
import { initVideoSync } from "./sync.js";

export default function initProjectPlayer(container) {
  const wrap = container.querySelector(".project-player_wrap");
  if (!wrap || wrap.dataset.scriptInitialized) return () => {};
  wrap.dataset.scriptInitialized = "true";

  const video = wrap.querySelector("video");
  if (!video) return () => {};

  const btnPlay = wrap.querySelector('[data-role="play"]');
  const btnMute = wrap.querySelector('[data-role="mute"]');
  const muteLabel = wrap.querySelector('[data-role="mute-label"]');
  const btnFS = wrap.querySelector('[data-role="fs"]');
  const tl = wrap.querySelector('[data-role="timeline"]');
  const tlBuf = wrap.querySelector(".project-player_timeline-buffer");
  const tlHandle = wrap.querySelector(".project-player_timeline-handle");

  ensurePauseOverlay(wrap);
  const centerBtn = ensureCenterButton(wrap);

  const state = createState(wrap, video, btnPlay, btnMute, muteLabel, btnFS, centerBtn);

  const controlHandlers = initControls({
    wrap, video, btnPlay, btnMute, muteLabel, btnFS, centerBtn, tl, tlBuf, tlHandle, state
  });

  const syncHandlers = initVideoSync(video, state);

  // Preload & paint first frame
  (async () => {
    await ensureFirstFramePainted(video);
    try { await video.play(); } catch {}
    state.setPlayUI(!video.paused);
    state.setPausedUI(video.paused);
    state.setMuteUI(true);
    state.updateFSLabel();
  })();

  // Start timeline sync
  const stopLoop = startTimelineLoop(video, tl, tlBuf, tlHandle);

  // Cleanup
  return () => {
    controlHandlers.forEach((fn) => fn());
    syncHandlers.forEach((fn) => fn());
    stopLoop();
    delete wrap.dataset.scriptInitialized;
  };
}
