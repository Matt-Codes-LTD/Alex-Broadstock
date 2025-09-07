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
        name: "dramatic-crossfade",

        /* First load */
        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          gsap.set(main, { opacity: 1, scale: 1, rotate: 0, y: 0, filter: "blur(0px)" });
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

          // New page starting state (dramatic entrance)
          gsap.set(newMain, {
            opacity: 0,
            scale: 1.15,
            rotate: 3,
            y: 50,
            filter: "blur(20px)",
            transformOrigin: "50% 50%",
          });

          const tl = gsap.timeline({
            defaults: { ease: "power4.inOut" },
            onComplete: () => {
              // Reset newMain
              newMain.style.position = "";
              newMain.style.inset = "";
              newMain.style.zIndex = "";
              if (oldMain && oldMain.parentNode) oldMain.remove();
              window.scrollTo(0, 0);
            },
          });

          // Old page exit: shrink, tilt back, fade out
          tl.to(oldMain, {
            opacity: 0,
            scale: 0.9,
            rotate: -5,
            y: -60,
            filter: "blur(20px)",
            duration: 0.9,
          }, 0);

          // New page enter: zoom/tilt in with overshoot
          tl.to(newMain, {
            opacity: 1,
            scale: 1,
            rotate: 0,
            y: 0,
            filter: "blur(0px)",
            duration: 1.2,
          }, "-=0.6"); // overlap so it feels fluid

          return tl;
        },
      },
    ],
  });
});
