export function initTimeline(video, tl, tlBuf, tlHandle, state) {
  if (!tl) return () => {};

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

  function seekPct(p) {
    if (!isFinite(video.duration)) return;
    video.currentTime = (Math.max(0, Math.min(100, p)) / 100) * video.duration;
    updateTimeUI();
  }

  const onDown = (e) => {
    state.dragging = true;
    tl.setPointerCapture?.(e.pointerId);
    const r = tl.getBoundingClientRect();
    seekPct(((e.clientX - r.left) / r.width) * 100);
    state.kickHide();
  };
  
  const onMove = (e) => {
    if (state.dragging) {
      const r = tl.getBoundingClientRect();
      seekPct(((e.clientX - r.left) / r.width) * 100);
    }
  };
  
  const endDrag = (e) => {
    state.dragging = false;
    // Release pointer capture
    tl.releasePointerCapture?.(e.pointerId);
  };
  
  const onKey = (e) => {
    const step = e.shiftKey ? 10 : 5;
    const now = Number(tl.getAttribute("aria-valuenow") || 0);
    if (e.key === "ArrowRight") {
      seekPct(now + step);
      e.preventDefault();
    }
    if (e.key === "ArrowLeft") {
      seekPct(now - step);
      e.preventDefault();
    }
  };

  tl.addEventListener("pointerdown", onDown);
  tl.addEventListener("pointermove", onMove);
  tl.addEventListener("pointerup", endDrag);
  tl.addEventListener("pointercancel", endDrag);
  tl.addEventListener("keydown", onKey);

  state.handlers.push(() => {
    tl.removeEventListener("pointerdown", onDown);
    tl.removeEventListener("pointermove", onMove);
    tl.removeEventListener("pointerup", endDrag);
    tl.removeEventListener("pointercancel", endDrag);
    tl.removeEventListener("keydown", onKey);
  });

  state.startLoop(updateTimeUI);

  return () => {};
}