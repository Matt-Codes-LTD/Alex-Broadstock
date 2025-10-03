// cursor/index.js - Performance optimized with blend mode fix
import { initGeometry } from "./geometry.js";

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

  // Blend mode is now handled in CSS on the wrapper

  // Geometry
  const geom = initGeometry(overlay);

  // State
  let targetX = 0, targetY = 0;
  let x = 0, y = 0;
  let scale = 1;
  let targetScale = 1;
  let isHovering = false;
  let rafId = null;
  let moveRaf = null;
  let lastMoveTime = 0;

  // PERFORMANCE: Throttle to 60fps max, skip if behind
  const FRAME_TIME = 16; // ~60fps

  // Animation loop - handles both position and scale
  function tick() {
    const now = performance.now();
    const delta = now - lastMoveTime;
    
    // Skip frame if we're behind (prevents stacking)
    if (delta < FRAME_TIME) {
      rafId = requestAnimationFrame(tick);
      return;
    }
    
    lastMoveTime = now;
    
    // Smooth easing
    x += (targetX - x) * 0.18;
    y += (targetY - y) * 0.18;
    scale += (targetScale - scale) * 0.2;
    
    // Only update if there's actual movement (saves GPU)
    const moved = Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1;
    const scaled = Math.abs(targetScale - scale) > 0.01;
    
    if (moved || scaled) {
      if (window.gsap) {
        gsap.set(box, {
          x: x,
          y: y,
          xPercent: -50,
          yPercent: -50,
          scale: scale,
          force3D: true
        });
      } else {
        box.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }
    }
    
    rafId = requestAnimationFrame(tick);
  }

  // Start animation loop
  tick();

  // Mouse move handler - THROTTLED
  const MOVE_THROTTLE = 8; // ~120fps max for mouse tracking
  let lastMouseUpdate = 0;
  
  function onMove(e) {
    const now = performance.now();
    if (now - lastMouseUpdate < MOVE_THROTTLE) return;
    lastMouseUpdate = now;
    
    if (moveRaf) return;
    moveRaf = requestAnimationFrame(() => {
      if (!geom.rect.width || !geom.rect.height) geom.computeGeometry();
      targetX = e.clientX - geom.rect.left;
      targetY = e.clientY - geom.rect.top;
      moveRaf = null;
    });
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
      targetX = geom.rect.width / 2;
      targetY = geom.rect.height / 2;
    }
  }
  document.addEventListener("mouseleave", onHardLeave, true);
  document.addEventListener("mouseout", onHardLeave, true);
  document.addEventListener("pointerout", onHardLeave, true);

  // Hover detection - DEBOUNCED
  let hoverTimeout = null;
  function onMouseOver(e) {
    if (hoverTimeout) return; // Debounce
    
    hoverTimeout = setTimeout(() => {
      hoverTimeout = null;
    }, 50);
    
    const target = e.target.closest('a, button, [role="button"], .home-hero_link, .nav_link, .home-category_text, .brand_logo');
    if (target && !isHovering) {
      isHovering = true;
      targetScale = 2.5;
    } else if (!target && isHovering) {
      isHovering = false;
      targetScale = 1;
    }
  }

  document.addEventListener("mouseover", onMouseOver, true);
  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) {
      isHovering = false;
      targetScale = 1;
    }
  }, true);

  // Click animation - pulse effect
  function onPointerDown() {
    targetScale = 3.5;
  }

  function onPointerUp() {
    targetScale = isHovering ? 2.5 : 1;
  }

  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);

  // Pause on tab hidden (saves CPU)
  const onVis = () => { 
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else if (!rafId) {
      lastMoveTime = performance.now();
      tick();
    }
  };
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
    if (rafId) cancelAnimationFrame(rafId);
    if (moveRaf) cancelAnimationFrame(moveRaf);
    if (hoverTimeout) clearTimeout(hoverTimeout);
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerenter", onMove);
    document.removeEventListener("mouseleave", onHardLeave, true);
    document.removeEventListener("mouseout", onHardLeave, true);
    document.removeEventListener("pointerout", onHardLeave, true);
    document.removeEventListener("mouseover", onMouseOver, true);
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerUp);
    document.removeEventListener("visibilitychange", onVis);
    geom.disconnect();
    mo.disconnect();
    delete window.__cursorInit;
  }
  
  // Expose cleanup for debugging
  window.__cursorCleanup = cleanup;
}