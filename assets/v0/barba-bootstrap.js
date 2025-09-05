/* =========================
   PAGE SCRIPTS (per Barba container)
========================= */
function initPageScripts(container) {
  const cleanups = [];
  cleanups.push(initSplitChars(container));
  cleanups.push(initHomeHero(container));
  cleanups.push(initProjectPlayer(container));
  return () => cleanups.forEach(fn => fn && fn());
}

/* =========================
   BARBA BOOTSTRAP (Swipe)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  // Global overlay (once)
  try { initCursor(); } catch (_) {}

  // Ensure the page transition overlay exists (create if missing)
  let overlay = document.querySelector(".page-transition_wrap");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "page-transition_wrap u-position-fixed u-inset-0 u-zindex-9999 u-pointer-off";
    overlay.setAttribute("aria-hidden", "true");
    const panel = document.createElement("div");
    panel.className = "page-transition_panel";
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }
  const panel = overlay.querySelector(".page-transition_panel");

  // Panel base styles (kept minimal; main styles live in CSS)
  if (window.gsap) {
    gsap.set(panel, { scaleX: 0, transformOrigin: "left center", clearProps: "opacity,visibility" });
  }

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DUR_LEAVE  = prefersReduced ? 0 : 0.60;
  const DUR_ENTER  = prefersReduced ? 0 : 0.55;
  const EASE_INOUT = "power4.inOut";
  const EASE_OUT   = "power3.out";

  let activeCleanup = () => {};

  barba.init({
    transitions: [{
      name: "swipe",
      leave({ current }) {
        // cleanup per-page scripts before swap
        try { activeCleanup(); } catch (_) {}
        // Left -> Right cover
        gsap.set(panel, { transformOrigin: "left center", scaleX: 0 });
        return gsap.to(panel, {
          scaleX: 1,
          duration: DUR_LEAVE,
          ease: EASE_INOUT
        });
      },
      enter({ next }) {
        // Right -> Left reveal
        gsap.set(panel, { transformOrigin: "right center", scaleX: 1 });
        return gsap.to(panel, {
          scaleX: 0,
          duration: DUR_ENTER,
          ease: EASE_OUT
        });
      },
      afterEnter({ next }) {
        activeCleanup = initPageScripts(next.container);
      }
    }]
  });

  // First container boot
  const firstContainer = document.querySelector('[data-barba="container"]');
  activeCleanup = initPageScripts(firstContainer);
});
