export function createState(video, wrap, centerBtn) {
  let raf = 0;
  let hidingTO = 0;
  let dragging = false;
  let didFirstSoundRestart = false;
  let gracePeriod = false; // Prevent hiding during initial period
  const handlers = [];

  // Initialize as not idle (controls visible)
  wrap.dataset.idle = "0";

  function setIdle(on) {
    wrap.dataset.idle = on ? "1" : "0";
  }

  function kickHide() {
    // Only hide if user has clicked sound button AND grace period is over
    if (!didFirstSoundRestart || gracePeriod) return;
    
    clearTimeout(hidingTO);
    setIdle(false);
    hidingTO = setTimeout(() => setIdle(true), 1500);
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
      if (v) {
        // Start grace period - controls stay visible
        gracePeriod = true;
        setIdle(false);
        setTimeout(() => {
          gracePeriod = false;
          kickHide(); // Now start idle detection
        }, 1500);
      }
    },
  };
}