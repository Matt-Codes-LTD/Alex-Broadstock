// Cursor follow overlay — tiny white square with easing (sleep-aware)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".cursor-crosshair_wrap").forEach((overlay) => {
    if (overlay.dataset.scriptInitialized) return;
    overlay.dataset.scriptInitialized = "true";

    overlay.querySelectorAll(
      ".cursor-crosshair_line, .cursor-crosshair_dot, .cursor-crosshair_dot-top, .cursor-crosshair_pulse"
    ).forEach(n => { try { n.remove(); } catch(_){} });

    let box = overlay.querySelector(".cursor-follow_box");
    if (!box) {
      box = document.createElement("div");
      box.className = "cursor-follow_box";
      overlay.appendChild(box);
    }

    // Geometry
    let rect = overlay.getBoundingClientRect();
    const computeGeometry = () => { rect = overlay.getBoundingClientRect(); };
    const ro = new ResizeObserver(computeGeometry);
    ro.observe(overlay);
    addEventListener("scroll", computeGeometry, { passive:true });

    // State
    const ease = 0.18;
    let targetX = rect.width / 2;
    let targetY = rect.height / 2;
    let x = targetX, y = targetY;

    const hasGSAP = () => !!(window.gsap && gsap.quickSetter && gsap.ticker);
    let useGsap = false, setX, setY;

    function useFallback() {
      useGsap = false;
      setX = (px) => { box.style.transform = `translate(${px}px, ${y}px)`; };
      setY = (py) => { box.style.transform = `translate(${x}px, ${py}px)`; };
      box.style.transform = `translate(${x}px, ${y}px)`;
    }
    function useGsapSetters() {
      useGsap = true;
      setX = gsap.quickSetter(box, "x", "px");
      setY = gsap.quickSetter(box, "y", "px");
      setX(x); setY(y);
    }
    hasGSAP() ? useGsapSetters() : useFallback();

    // Wake/sleep control
    let rafId = 0;
    let ticking = false;
    let asleep = false;

    const EPS = 0.05;           // sub-pixel settle threshold
    const SLEEP_FRAMES = 3;     // settle frames before sleep
    let settleCount = 0;

    const tick = () => {
      const dx = targetX - x;
      const dy = targetY - y;
      x += dx * ease;
      y += dy * ease;
      setX(x); setY(y);

      if (Math.abs(dx) < EPS && Math.abs(dy) < EPS) {
        if (++settleCount >= SLEEP_FRAMES) { goSleep(); return; }
      } else {
        settleCount = 0;
      }

      if (useGsap) return; // GSAP ticker will keep calling tick
      rafId = requestAnimationFrame(tick);
    };

    function wake() {
      if (asleep) { asleep = false; settleCount = 0; }
      if (ticking) return;
      ticking = true;
      if (hasGSAP()) {
        if (!useGsap) useGsapSetters();
        gsap.ticker.add(tick);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    }
    function goSleep() {
      if (!ticking) return;
      ticking = false; asleep = true;
      if (useGsap && window.gsap) gsap.ticker.remove(tick);
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }

    function onMove(e) {
      if (!rect.width || !rect.height) computeGeometry();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      wake();
    }
    addEventListener("pointermove", onMove, { passive:true });
    addEventListener("pointerenter", onMove, { passive:true });

    function onHardLeave(e) {
      if (e.pointerType === "touch") return;
      const leftViewport = (e.relatedTarget == null);
      const atEdge = (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= innerWidth || e.clientY >= innerHeight);
      if (leftViewport || atEdge) {
        computeGeometry();
        targetX = rect.width / 2;
        targetY = rect.height / 2;
        wake();
      }
    }
    document.addEventListener("mouseleave", onHardLeave, true);
    document.addEventListener("mouseout",   onHardLeave, true);
    document.addEventListener("pointerout", onHardLeave, true);

    // Pause on tab hide
    const onVis = () => { document.hidden ? goSleep() : wake(); };
    document.addEventListener("visibilitychange", onVis);

    // Initially sleep; wake on the first move
    goSleep();

    // If GSAP loads later, hot-swap setters but stay asleep until movement
    addEventListener("load", () => { if (!useGsap && hasGSAP()) { useGsapSetters(); } }, { once:true });

    // Cleanup
    const mo = new MutationObserver(() => {
      if (!document.body.contains(overlay)) {
        goSleep(); document.removeEventListener("visibilitychange", onVis);
        ro.disconnect(); mo.disconnect();
      }
    });
    mo.observe(document.body, { childList:true, subtree:true });
  });
});
