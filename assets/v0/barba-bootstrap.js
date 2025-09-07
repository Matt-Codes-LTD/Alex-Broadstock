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
        name: "crossfade-blur",

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
          // don’t animate here — handled in enter()
          return Promise.resolve();
        },

        /* Entering page */
        enter({ current, next }) {
          const oldMain = current.container;
          const newMain = next.container;

          next.container.__cleanup = initPageScripts(newMain);

          // stack containers on top of each other
          oldMain.style.position = "absolute";
          oldMain.style.inset = "0";
          oldMain.style.zIndex = "1";

          newMain.style.position = "absolute";
          newMain.style.inset = "0";
          newMain.style.zIndex = "2";

          // start new page hidden
          gsap.set(newMain, {
            opacity: 0,
            scale: 1.05,
            y: 20,
            filter: "blur(12px)",
          });

          const tl = gsap.timeline({
            defaults: { ease: "power3.inOut" },
            onComplete: () => {
              // cleanup
              newMain.style.position = "";
              newMain.style.inset = "";
              newMain.style.zIndex = "";
              oldMain.remove();
              window.scrollTo(0, 0);
            },
          });

          // true crossfade: animate both together
          tl.to(oldMain, {
            opacity: 0,
            scale: 0.95,
            y: -20,
            filter: "blur(12px)",
            duration: 0.8,
          }, 0)
          .to(newMain, {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.0,
          }, 0);

          return tl;
        },
      },
    ],
  });
});
