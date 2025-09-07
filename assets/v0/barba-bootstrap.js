/* =========================
   PAGE SCRIPTS (per Barba container)
========================= */
function initPageScripts(container) {
  const cleanups = [];
  cleanups.push(initSplitChars(container));
  cleanups.push(initHomeHero(container));
  cleanups.push(initProjectPlayer(container));
  return () => cleanups.forEach((fn) => fn && fn());
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
        name: "depth-crossfade-wash",

        /* First load */
        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          gsap.set(main, { opacity: 1, scale: 1, y: 0 });
        },

        /* Leave */
        leave({ current }) {
          console.log("[Barba] leave()", current.namespace);
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          // Create overlay wash
          const overlay = document.createElement("div");
          overlay.style.position = "fixed";
          overlay.style.inset = "0";
          overlay.style.background = "rgba(255,255,255,0.15)";
          overlay.style.pointerEvents = "none";
          overlay.style.zIndex = "9999";
          overlay.style.opacity = "0";
          document.body.appendChild(overlay);

          return gsap.timeline({
            defaults: { ease: "power2.inOut" },
            onComplete: () => overlay.remove(),
          })
            .to(overlay, { opacity: 1, duration: 0.25 }, 0)
            .to(current.container, {
              opacity: 0,
              scale: 0.95,
              y: -15,
              duration: 0.6,
              ease: "power2.in",
            }, 0)
            .to(overlay, { opacity: 0, duration: 0.6 }, 0.3);
        },

        /* Enter */
        enter({ next }) {
          console.log("[Barba] enter()", next.namespace);

          const main = next.container;
          main.__cleanup = initPageScripts(main);

          gsap.set(main, { opacity: 0, scale: 1.03, y: 15 });

          return gsap.to(main, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
          });
        },
      },
    ],
  });
});
