export function createState(video, wrap, centerBtn) {
  let raf = 0;
  let hidingTO = 0;
  let dragging = false;
  let didFirstSoundRestart = false;
  const handlers = [];

  // Initialize as not idle (controls visible)
  wrap.dataset.idle = "0";

  function setIdle(on) {
    wrap.dataset.idle = on ? "1" : "0";
  }

  function kickHide() {
    // Remove condition - idle works immediately
    clearTimeout(hidingTO);
    setIdle(false);
    hidingTO = setTimeout(() => setIdle(true), 1800);
  }

  function startLoop(loopFn) {
    const step = () => {
      loopFn();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function cleanup() {
    stopLoop();
    clearTimeout(hidingTO);
    handlers.forEach((fn) => fn());
  }

  return {
    video,
    wrap,
    centerBtn,
    handlers,
    kickHide,
    startLoop,
    stopLoop,
    cleanup,
    get dragging() {
      return dragging;
    },
    set dragging(v) {
      dragging = v;
    },
    get didFirstSoundRestart() {
      return didFirstSoundRestart;
    },
    set didFirstSoundRestart(v) {
      didFirstSoundRestart = v;
    },
  };
}