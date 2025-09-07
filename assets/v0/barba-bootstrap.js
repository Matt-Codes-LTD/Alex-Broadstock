/* =========================
   HELPERS
========================= */
function tweenPromise(target, vars) {
  return new Promise((resolve) => {
    gsap.to(target, { ...vars, onComplete: resolve });
  });
}

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

  // Init cursor globally once
  try {
    initCursor();
  } catch (e) {
    console.warn("[Cursor] init error", e);
  }

  barba.init({
    transitions: [
      {
        name: "fade-blur-scale",
        sync: true, // run leave + enter together

        /* First page load */
        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);

          gsap.set(main, { opacity: 1, scale: 1, filter: "blur(0px)" });
        },

        /* Leaving page */
        leave({ current }) {
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          const oldMain = current.container;
          if (!oldMain) return Promise.resolve();

          oldMain.style.willChange = "opacity, transform, filter";
          oldMain.style.pointerEvents = "none";

          return gsap.to(oldMain, {
            opacity: 0,
            scale: 0.95,          // shrink slightly
            y: -20,               // lift upward just a touch
            filter: "blur(12px)", // stronger blur on exit
            duration: 0.7,
            ease: "power3.inOut",
          });
        },

        /* Entering page */
        enter({ next }) {
          const newMain = next.container;
          newMain.__cleanup = initPageScripts(newMain);

          if (!newMain) return;

          gsap.set(newMain, {
            opacity: 0,
            scale: 1.05,          // start slightly larger
            y: 20,                // start slightly lower
            filter: "blur(12px)",
            willChange: "opacity, transform, filter",
          });

          return gsap.to(newMain, {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.9,
            delay: 0.1,           // 👈 overlap offset (starts before old fully gone)
            ease: "power3.out",
            onComplete: () => {
              newMain.style.willChange = "";
              window.scrollTo(0, 0);
            },
          });
        },
      },
    ],
  });
});
