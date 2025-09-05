/* =========================
   PAGE TRANSITION — SWIPE (modular)
   Exposes: window.initPageTransitionSwipe(opts?)
========================= */
(function () {
  if (window.initPageTransitionSwipe) return;

  window.initPageTransitionSwipe = function initPageTransitionSwipe(opts = {}) {
    // guard re-init
    if (window.__pageSwipeInit) return;
    window.__pageSwipeInit = true;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Options / defaults
    const DUR_LEAVE = reduceMotion ? 0 : (opts.leaveDuration ?? 0.60);
    const DUR_ENTER = reduceMotion ? 0 : (opts.enterDuration ?? 0.55);
    const EASE_INOUT = opts.leaveEase ?? "power4.inOut";
    const EASE_OUT   = opts.enterEase ?? "power3.out";
    const color      = opts.color ?? null;  // override panel color
    const useOvershoot = !!opts.overshoot;  // subtle edge overshoot

    // Ensure overlay exists (create if missing for modularity)
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
    if (color) panel.style.background = color;

    // Start hidden
    if (window.gsap) gsap.set(panel, { scaleX: 0, transformOrigin: "left center", clearProps: "opacity,visibility" });

    let activeCleanup = () => {};

    // Barba transitions
    barba.init({
      transitions: [{
        name: "swipe",
        async leave({ current }) {
          // cleanup page scripts for current container
          try { activeCleanup(); } catch(_) {}

          // left -> right cover
          gsap.set(panel, { transformOrigin: "left center", scaleX: 0 });
          const tl = gsap.timeline();
          tl.to(panel, {
            scaleX: 1,
            duration: DUR_LEAVE,
            ease: EASE_INOUT
          });
          if (useOvershoot && !reduceMotion) {
            tl.to(panel, { scaleX: 1.02, duration: 0.12, ease: "power2.out" }, "<");
            tl.to(panel, { scaleX: 1.00, duration: 0.12, ease: "power2.inOut" }, ">");
          }
          return tl;
        },
        async enter({ next }) {
          // right -> left reveal
          gsap.set(panel, { transformOrigin: "right center", scaleX: 1 });
          const tl = gsap.timeline();
          if (useOvershoot && !reduceMotion) {
            tl.to(panel, { scaleX: 1.02, duration: 0.10, ease: "power2.out" });
          }
          tl.to(panel, {
            scaleX: 0,
            duration: DUR_ENTER,
            ease: EASE_OUT
          });
          return tl;
        },
        afterEnter({ next }) {
          // Initialize per-page scripts on the new container
          if (typeof initPageScripts === "function") {
            activeCleanup = initPageScripts(next.container);
          } else {
            activeCleanup = () => {};
          }
        }
      }]
    });

    // First page boot (init per-page scripts once at load)
    const firstContainer = document.querySelector('[data-barba="container"]');
    if (firstContainer && typeof initPageScripts === "function") {
      activeCleanup = initPageScripts(firstContainer);
    }

    // Make sure global cursor is set once if you use it
    if (typeof initCursor === "function") initCursor();

    return () => {
      // (optional) expose teardown if you ever need it
      try { activeCleanup(); } catch(_) {}
    };
  };
})();
