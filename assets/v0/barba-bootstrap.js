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

        /* Leave + Enter with overlap */
        leave({ current, next }) {
          console.log("[Barba] leave()", current.namespace, "→ enter()", next.namespace);

          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          const tl = gsap.timeline({
            defaults: { ease: "power2.inOut", duration: 0.6 },
          });

          // Set new container offscreen to the right
          gsap.set(next.container, { opacity: 0, x: 50 });

          // Animate old container out
          tl.to(current.container, { opacity: 0, x: -50 }, 0);

          // Animate new container in with overlap
          tl.to(next.container, { opacity: 1, x: 0 }, "-=0.4");

          return tl;
        },

        /* Enter (in case of refresh or direct load) */
        enter({ next }) {
          console.log("[Barba] enter()", next.namespace);
          const main = next.container;
          main.__cleanup = initPageScripts(main);

          // Safety: ensure container is visible
          gsap.set(main, { opacity: 1, x: 0 });
        },
      },
    ],
  });
});
