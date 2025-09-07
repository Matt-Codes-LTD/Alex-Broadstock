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
          gsap.set(main, { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" });
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

          // New page starting state (tiny offset for polish)
          gsap.set(newMain, {
            opacity: 0,
            scale: 0.995,
            y: 8,
            filter: "blur(3px)",
          });

          // Create overlay wash
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

          // Overlay fade in/out (super quick)
          tl.to(overlay, { opacity: 0.08, duration: 0.1 }, 0)
            .to(overlay, { opacity: 0, duration: 0.2 }, 0.1);

          // Old page exit (minimal movement/blur)
          tl.to(oldMain, {
            opacity: 0,
            scale: 0.98,
            y: -10,
            filter: "blur(3px)",
            duration: 0.2,
            ease: "power1.inOut",
          }, 0);

          // New page enter (fast + clean)
          tl.to(newMain, {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.25,
            ease: "power1.out",
          }, "-=0.1");

          return tl;
        },
      },
    ],
  });
});
