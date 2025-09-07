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
        name: "cinematic-crossfade",

        /* First load */
        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          gsap.set(main, { opacity: 1 });
        },

        /* Leave */
        leave({ current, next }) {
          console.log(`[Barba] leave() from: ${current.namespace} → to: ${next.namespace}`);
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
          return Promise.resolve();
        },

        /* Enter */
        enter({ current, next }) {
          console.log(`[Barba] enter() from: ${current.namespace} → to: ${next.namespace}`);

          const oldMain = current.container;
          const newMain = next.container;

          newMain.__cleanup = initPageScripts(newMain);

          // Stack containers
          oldMain.style.position = "absolute";
          oldMain.style.inset = "0";
          oldMain.style.zIndex = "1";

          newMain.style.position = "absolute";
          newMain.style.inset = "0";
          newMain.style.zIndex = "2";

          // New page starting state (just transparent)
          gsap.set(newMain, { opacity: 0 });

          // Overlay wash
          const overlay = document.createElement("div");
          overlay.style.position = "fixed";
          overlay.style.inset = "0";
          overlay.style.background = "#000";
          overlay.style.pointerEvents = "none";
          overlay.style.zIndex = "9999";
          overlay.style.opacity = "0";
          document.body.appendChild(overlay);

          const tl = gsap.timeline({
            defaults: { ease: "power1.out" },
            onComplete: () => {
              newMain.style.position = "";
              newMain.style.inset = "";
              newMain.style.zIndex = "";
              if (oldMain && oldMain.parentNode) oldMain.remove();
              if (overlay && overlay.parentNode) overlay.remove();
              window.scrollTo(0, 0);
            },
          });

          // All in one motion
          tl.to([oldMain, newMain, overlay], {
            opacity: (i, target) => {
              if (target === oldMain) return 0;   // fade out old
              if (target === newMain) return 1;   // fade in new
              return 0.08;                        // overlay peak
            },
            duration: 0.25,
          }, 0);

          // Overlay back to 0 in same motion
          tl.to(overlay, { opacity: 0, duration: 0.25 }, 0);

          return tl;
        },
      },
    ],
  });
});
