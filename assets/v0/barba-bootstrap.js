/* ========================= PAGE SCRIPTS (per Barba container) ========================= */
function initPageScripts(container) {
  const cleanups = [];
  cleanups.push(initSplitChars(container));
  cleanups.push(initHomeHero(container));
  cleanups.push(initProjectPlayer(container));

  return () => cleanups.forEach((fn) => fn && fn());
}

/* ========================= BARBA BOOTSTRAP ========================= */
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
          console.log(
            `[Barba] leave() from: ${current.namespace} → to: ${next.namespace}`
          );

          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          return Promise.resolve();
        },

        /* Enter */
        enter({ current, next }) {
          console.log(
            `[Barba] enter() from: ${current.namespace} → to: ${next.namespace}`
          );

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

          // New page starting state
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
            onComplete: () => {
              newMain.style.position = "";
              newMain.style.inset = "";
              newMain.style.zIndex = "";

              if (oldMain && oldMain.parentNode) oldMain.remove();
              if (overlay && overlay.parentNode) overlay.remove();

              window.scrollTo(0, 0);
            },
          });

          // Page crossfade (both at same time, smooth)
          tl.to(
            [oldMain, newMain],
            {
              opacity: (i, target) => (target === oldMain ? 0 : 1),
              duration: 0.5,
              ease: "power2.inOut",
            },
            0
          );

          // Overlay breath (in quicker, out slower)
          tl.to(
            overlay,
            { opacity: 0.15, duration: 0.2, ease: "power2.out" },
            0
          );
          tl.to(
            overlay,
            { opacity: 0, duration: 0.4, ease: "power2.in" },
            0.1
          );

          return tl;
        },
      },
    ],
  });
});
