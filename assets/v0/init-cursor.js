/* =========================
   CURSOR (global, once)
========================= */
function initCursor() {
  if (window.__cursorInit) return;
  window.__cursorInit = true;

  const overlay = document.querySelector(".cursor-crosshair_wrap");
  if (!overlay) return;

  // Remove legacy bits if left in DOM
  overlay
    .querySelectorAll(
      ".cursor-crosshair_line, .cursor-crosshair_dot, .cursor-crosshair_dot-top, .cursor-crosshair_pulse"
    )
    .forEach((n) => {
      try {
        n.remove();
      } catch (_) {}
    });

  // Ensure square exists
  let box = overlay.querySelector(".cursor-follow_box");
  if (!box) {
    box = document.createElement("div");
    box.className = "cursor-follow_box";
    overlay.appendChild(box);
  }

  // Geometry & observers
  let rect = overlay.getBoundingClientRect();
  const computeGeometry = () => {
    rect = overlay.getBoundingClientRect();
  };
  computeGeometry();

  const ro = new ResizeObserver(computeGeometry);
  ro.observe(overlay);

  addEventListener("scroll", computeGeometry, { passive: true });

  // GSAP hot-swap if present
  const hasGSAP = () => !!(window.gsap && gsap.quickSetter && gsap.ticker);
  let useGsap = false,
    setX,
    setY;

  function useFallback() {
    useGsap = false;
    setX = (px) => {
      box.style.transform = `translate(${px}px, ${y}px)`;
    };
    setY = (py) => {
      box.style.transform = `translate(${x}px, ${py}px)`;
    };
    box.style.transform = `translate(${x}px, ${y}px)`;
  }

  function useGsapSetters() {
    useGsap = true;
    setX = gsap.quickSetter(box, "x", "px");
    setY = gsap.quickSetter(box, "y", "px");
    setX(x);
    setY(y);
  }

  const ease = 0.18;
  let targetX = rect.width / 2,
    targetY = rect.height / 2;
  let x = targetX,
    y = targetY;

  function onMove(e) {
    if (!rect.width || !rect.height) computeGeometry();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
  }
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerenter", onMove, { passive: true });

  function onHardLeave(e) {
    if (e.pointerType === "touch") return;
    const leftViewport = e.relatedTarget == null;
    const atEdge =
      e.clientX <= 0 ||
      e.clientY <= 0 ||
      e.clientX >= innerWidth ||
      e.clientY >= innerHeight;

    if (leftViewport || atEdge) {
      computeGeometry();
      targetX = rect.width / 2;
      targetY = rect.height / 2;
    }
  }
  document.addEventListener("mouseleave", onHardLeave, true);
  document.addEventListener("mouseout", onHardLeave, true);
  document.addEventListener("pointerout", onHardLeave, true);

  let rafId = null;
  const tick = () => {
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    setX(x);
    setY(y);
  };

  function start() {
    if (hasGSAP()) {
      if (!useGsap) useGsapSetters();
      gsap.ticker.add(tick);
    } else if (!rafId) {
      const loop = () => {
        tick();
        rafId = requestAnimationFrame(loop);
      };
      useFallback();
      rafId = requestAnimationFrame(loop);
    }
  }

  function stop() {
    if (useGsap && window.gsap) gsap.ticker.remove(tick);
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  start();

  addEventListener(
    "load",
    () => {
      if (!useGsap && hasGSAP()) {
        stop();
        useGsapSetters();
        gsap.ticker.add(tick);
        useGsap = true;
      }
    },
    { once: true }
  );

  const onVis = () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  };
  document.addEventListener("visibilitychange", onVis);

  // Cleanup if overlay ever removed
  const mo = new MutationObserver(() => {
    if (!document.body.contains(overlay)) {
      stop();
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}
