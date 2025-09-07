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
        name: "directional-crossfade",

        /* First load */
        once({ next }) {
          console.log("[Barba] once()", next.namespace);
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          gsap.set(main, { opacity: 1, x: 0 });
        },

        /* Leave */
        leave({ current }) {
          console.log("[Barba] leave()", current.namespace);
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          return gsap.to(current.container, {
            opacity: 0,
            x: -50,
            duration: 0.6,
            ease: "power2.in",
          });
        },

        /* Enter */
        enter({ next }) {
          console.log("[Barba] enter()", next.namespace);
          const main = next.container;
          main.__cleanup = initPageScripts(main);

          gsap.set(main, { opacity: 0, x: 50 });

          return gsap.to(main, {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power3.out",
          });
        },
      },
    ],
  });
});
