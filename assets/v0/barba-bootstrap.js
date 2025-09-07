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
   BOOTSTRAP
========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  // Init cursor globally once
  try {
    initCursor();
  } catch (e) {
    console.warn("[Cursor] init error", e);
  }

  // GSAP tween helpers
  const tweenPromise = (target, vars) =>
    new Promise((resolve) => gsap.to(target, { ...vars, onComplete: resolve }));
  const fromToPromise = (target, fromVars, toVars) =>
    new Promise((resolve) =>
      gsap.fromTo(target, fromVars, { ...toVars, onComplete: resolve })
    );

  barba.init({
    transitions: [
      {
        name: "fade-blur",

        once({ next }) {
          console.log("[Barba] once()", next.container);
          next.container.__cleanup = initPageScripts(next.container);
          gsap.set(next.container, { opacity: 1 });
        },

        leave({ current }) {
          console.log("[Barba] leave() fired", current);

          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          const oldMain = current.container; // container IS .page_main
          if (!oldMain) {
            console.warn("[Barba] leave() → no container found!");
            return Promise.resolve();
          }

          oldMain.style.willChange = "opacity, transform, filter";
          oldMain.style.pointerEvents = "none";

          return tweenPromise(oldMain, {
            opacity: 0,
            scale: 0.98,
            filter: "blur(8px)",
            duration: 0.4,
            ease: "power1.out",
            onStart: () => console.log("[GSAP] leave animation start"),
          });
        },

        enter({ next }) {
          console.log("[Barba] enter() fired", next);

          const newMain = next.container; // container IS .page_main
          next.container.__cleanup = initPageScripts(next.container);

          if (!newMain) {
            console.warn("[Barba] enter() → no container found!");
            return;
          }

          gsap.set(newMain, {
            opacity: 0,
            scale: 1.02,
            filter: "blur(8px)",
            willChange: "opacity, transform, filter",
          });

          return fromToPromise(
            newMain,
            { opacity: 0, scale: 1.02, filter: "blur(8px)" },
            {
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              duration: 0.7,
              delay: 0.1,
              ease: "power2.out",
              onStart: () => console.log("[GSAP] enter animation start"),
              onComplete: () => {
                console.log("[GSAP] enter animation complete");
                newMain.style.willChange = "";
                window.scrollTo(0, 0);
              },
            }
          );
        },
      },
    ],
  });
});
