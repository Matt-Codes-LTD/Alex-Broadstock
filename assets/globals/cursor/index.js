// index.js - Fixed with throttling and cleanup
import { initGeometry } from "./geometry.js";
import { createFollowLoop } from "./follow-loop.js";

/* =========================
   CURSOR (global, once)
========================= */
export default function initCursor() {
  if (window.__cursorInit) return;
  window.__cursorInit = true;

  const overlay = document.querySelector(".cursor-crosshair_wrap");
  if (!overlay) return;

  // Clean legacy nodes
  overlay.querySelectorAll(
    ".cursor-crosshair_line, .cursor-crosshair_dot, .cursor-crosshair_dot-top, .cursor-crosshair_pulse"
  ).forEach((n) => n.remove?.());

  // Ensure square exists
  let box = overlay.querySelector(".cursor-follow_box");
  if (!box) {
    box = document.createElement("div");
    box.className = "cursor-follow_box";
    overlay.appendChild(box);
  }

  // Geometry
  const geom = initGeometry(overlay);

  // Follow loop
  const loop = createFollowLoop(box);
  loop.start();

  // Throttled pointer move (16ms = ~60fps)
  let moveRaf = null;
  let lastX = 0, lastY = 0;
  
  function onMove(e) {
    lastX = e.clientX;
    lastY = e.clientY;
    
    if (!moveRaf) {
      moveRaf = requestAnimationFrame(() => {
        if (!geom.rect.width || !geom.rect.height) geom.computeGeometry();
        loop.setTarget(lastX - geom.rect.left, lastY - geom.rect.top);
        moveRaf = null;
      });
    }
  }
  
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerenter", onMove, { passive: true });

  // Reset to center on hard leave
  function onHardLeave(e) {
    if (e.pointerType === "touch") return;
    const leftViewport = e.relatedTarget == null;
    const atEdge =
      e.clientX <= 0 || e.clientY <= 0 || e.clientX >= innerWidth || e.clientY >= innerHeight;
    if (leftViewport || atEdge) {
      geom.computeGeometry();
      loop.setTarget(geom.rect.width / 2, geom.rect.height / 2);
    }
  }
  document.addEventListener("mouseleave", onHardLeave, true);
  document.addEventListener("mouseout", onHardLeave, true);
  document.addEventListener("pointerout", onHardLeave, true);

  // Upgrade to GSAP if loaded after init
  const loadHandler = () => {
    if (!loop.hasGSAP()) return;
    loop.stop();
    loop.start();
  };
  addEventListener("load", loadHandler, { once: true });

  // Pause on tab hidden
  const onVis = () => { document.hidden ? loop.stop() : loop.start(); };
  document.addEventListener("visibilitychange", onVis);

  // Cleanup if overlay removed
  const mo = new MutationObserver(() => {
    if (!document.body.contains(overlay)) {
      cleanup();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
  
  // Unified cleanup
  function cleanup() {
    if (moveRaf) cancelAnimationFrame(moveRaf);
    loop.stop();
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerenter", onMove);
    removeEventListener("load", loadHandler);
    document.removeEventListener("mouseleave", onHardLeave, true);
    document.removeEventListener("mouseout", onHardLeave, true);
    document.removeEventListener("pointerout", onHardLeave, true);
    document.removeEventListener("visibilitychange", onVis);
    geom.disconnect();
    mo.disconnect();
    delete window.__cursorInit;
  }
  
  // Expose cleanup for debugging
  window.__cursorCleanup = cleanup;
}