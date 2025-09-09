// index.js
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

  // Pointer move
  function onMove(e) {
    if (!geom.rect.width || !geom.rect.height) geom.computeGeometry();
    loop.setTarget(e.clientX - geom.rect.left, e.clientY - geom.rect.top);
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
  addEventListener("load", () => {
    if (!loop.hasGSAP()) return;
    loop.stop();
    loop.start();
  }, { once: true });

  // Pause on tab hidden
  const onVis = () => { document.hidden ? loop.stop() : loop.start(); };
  document.addEventListener("visibilitychange", onVis);

  // Cleanup if overlay removed
  const mo = new MutationObserver(() => {
    if (!document.body.contains(overlay)) {
      loop.stop();
      document.removeEventListener("visibilitychange", onVis);
      geom.disconnect();
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}
