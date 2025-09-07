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
   LENIS (global, once)
========================= */
let lenis;
function initLenis() {
  if (lenis) lenis.destroy();
  lenis = new Lenis({ autoRaf: true, smoothWheel: true });
}

/* =========================
   Helpers
========================= */
function tweenPromise(target, vars) {
  console.log("[GSAP] tweenPromise start →", target, vars);
  const g = window.gsap;
  if (!g || !target) {
    console.warn("[GSAP] Missing target or gsap, resolving immediately");
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const tween = g.to(target, {
      ...vars,
      onComplete: () => {
        console.log("[GSAP] tweenPromise complete →", target);
        resolve();
      },
    });
    console.log("[GSAP] tween created?", tween);
  });
}
function fromToPromise(target, fromVars, toVars) {
  console.log("[GSAP] fromToPromise start →", target, fromVars, toVars);
  const g = window.gsap;
  if (!g || !target) {
    console.warn("[GSAP] Missing target or gsap, resolving immediately");
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const tween = g.fromTo(target, fromVars, {
      ...toVars,
      onComplete: () => {
        console.log("[GSAP] fromToPromise complete →", target);
        resolve();
      },
    });
    console.log("[GSAP] tween created?", tween);
  });
}

/* =========================
   BOOTSTRAP (Barba + GSAP)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  try { initCursor(); } catch (e) { console.warn("initCursor failed", e); }
  initLenis();

  console.log("[Barba] init starting…");

  barba.init({
    transitions: [
      {
        name: "gsap-crossfade-scale-blur",
        sync: true, // leave & enter overlap

        once({ next }) {
          console.log("[Barba] once()", next.container);
          next.container.__cleanup = initPageScripts(next.container);
        },

        leave({ current }) {
          console.log("[Barba] leave() fired", current);
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          const oldMain = current.container.querySelector(".page_main");
          if (!oldMain) {
            console.warn("[Barba] leave() → no .page_main found!");
            return Promise.resolve();
          }

          console.log("[Barba] Animating oldMain out", oldMain);

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

        async enter({ next }) {
          console.log("[Barba] enter() fired", next);

          const newMain = next.container.querySelector(".page_main");

          next.container.__cleanup = initPageScripts(next.container);

          if (!newMain) {
            console.warn("[Barba] enter() → no .page_main found!");
            return;
          }

          console.log("[Barba] Preparing newMain", newMain);

          window.gsap && gsap.set(newMain, {
            opacity: 0,
            scale: 1.02,
            filter: "blur(8px)",
            willChange: "opacity, transform, filter",
          });

          await fromToPromise(
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
