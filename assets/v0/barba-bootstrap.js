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
        name: "crossfade-blur",

        /* First load */
        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          gsap.set(main, { opacity: 1, scale: 1, filter: "blur(0px)" });
        },

        /* Leave always resolves, but let enter handle animation */
        leave({ current }) {
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
          return Promise.resolve();
        },

        /* Enter animates both old + new */
        enter({ current, next }) {
          const oldMain = current.container;
          const newMain = next.container;

          newMain.__cleanup = initPageScripts(newMain);

          // Ensure both are in DOM and stacked
          oldMain.style.position = "absolute";
          oldMain.style.inset = "0";
          oldMain.style.zIndex = "1";

          newMain.style.position = "absolute";
          newMain.style.inset = "0";
          newMain.style.zIndex = "2";

          gsap.set(newMain, {
            opacity: 0,
            scale: 1.05,
            y: 20,
            filter: "blur(12px)",
          });

          const tl = gsap.timeline({
            defaults: { ease: "power3.inOut" },
            onComplete: () => {
              // cleanup for newMain
              newMain.style.position = "";
              newMain.style.inset = "";
              newMain.style.zIndex = "";
              // always remove oldMain (even if it's home)
              if (oldMain && oldMain.parentNode) oldMain.remove();
              window.scrollTo(0, 0);
            },
          });

          // true crossfade
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
