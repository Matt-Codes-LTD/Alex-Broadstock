// timeline-loop.js
export function startTimelineLoop(video, tl, tlBuf, tlHandle) {
  let rafId = 0;

  function updateTimeUI() {
    if (!isFinite(video.duration)) return;

    const pct = (video.currentTime / video.duration) * 100;

    if (tlHandle) tlHandle.style.left = pct + "%";
    if (tl) tl.setAttribute("aria-valuenow", String(Math.round(pct)));

    if (video.buffered && video.buffered.length && tlBuf) {
      const end = video.buffered.end(video.buffered.length - 1);
      tlBuf.style.width = Math.min(100, (end / video.duration) * 100) + "%";
    }
  }

  function loop() {
    updateTimeUI();
    rafId = requestAnimationFrame(loop);
  }

  loop();

  return () => cancelAnimationFrame(rafId);
}
