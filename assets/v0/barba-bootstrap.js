/* =========================
   HELPERS
========================= */
function initPageScripts(container) {
  const cleanups = [];
  cleanups.push(initSplitChars(container));
  cleanups.push(initHomeHero(container));
  cleanups.push(initProjectPlayer(container));
  return () => cleanups.forEach((fn) => fn && fn());
}

/* =========================
   OVERLAY (global, once)
========================= */
function getOverlay() {
  let overlay = document.querySelector(".page-transition_overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "page-transition_overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "#000", // black wash (change to white/brand if you prefer)
      opacity: "0",
      pointerEvents: "none",
      zIndex: "9999",
    });
    document.body.appendChild(overlay);
  }
  return overlay;
}

/* =========================
   BARBA BOOTSTRAP
========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  try {
    initCursor();
  } catch (e) {
    console.warn("[Cursor] init error", e);
  }

  barba.init({
    transitions: [
      {
        name: "fade-blur-scale-overlay",
        async once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          gsap.set(main, { opacity: 1, scale: 1, filter: "blur(0px)" });
        },

        async leave({ current }) {
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
          // leave must return a promise so barba knows when to continue
          return new Promise((resolve) => resolve());
        },

        async enter({ current, next }) {
          const oldMain = current.container;
          const newMain = next.container;
          const overlay = getOverlay();

          next.container.__cleanup = initPageScripts(newMain);

          // setup new container off-screen / hidden
          gsap.set(newMain, {
            opacity: 0,
            scale: 1.05,
            y: 20,
            filter: "blur(12px)",
            willChange: "opacity, transform, filter",
          });

          // timeline that animates both together
          const tl = gsap.timeline({
            defaults: { ease: "power3.inOut" },
            onComplete: () => {
              newMain.style.willChange = "";
              window.scrollTo(0, 0);
            },
          });

          // fade out old page + fade in overlay
          tl.to(
            oldMain,
            {
              opacity: 0,
              scale: 0.95,
              y: -20,
              filter: "blur(12px)",
              duration: 0.7,
            },
            0
          ).to(
            overlay,
            {
              opacity: 0.4,
              duration: 0.5,
            },
            0
          );

          // fade in new page + fade out overlay with overlap
          tl.to(
            newMain,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.9,
            },
            "-=0.4" // 👈 overlap starts before old is fully gone
          ).to(
            overlay,
            {
              opacity: 0,
              duration: 0.6,
            },
            "-=0.3" // 👈 overlay fades out while new fades in
          );

          return tl;
        },
      },
    ],
  });
});
