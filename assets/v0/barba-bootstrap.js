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
  const g = window.gsap;
  if (!g || !target) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    const tween = g.to(target, { ...vars, onComplete: done });
    // if GSAP finishes synchronously (unlikely), ensure resolve still fires
    if (!tween) resolve();
  });
}
function fromToPromise(target, fromVars, toVars) {
  const g = window.gsap;
  if (!g || !target) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    const tween = g.fromTo(target, fromVars, { ...toVars, onComplete: done });
    if (!tween) resolve();
  });
}

/* =========================
   BOOTSTRAP (Barba + GSAP)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  try { initCursor(); } catch (e) {}
  initLenis();

  barba.init({
    transitions: [
      {
        name: "gsap-crossfade-scale-blur",
        sync: true, // run leave & enter together for overlap

        // First paint (no transition)
        once({ next }) {
          next.container.__cleanup = initPageScripts(next.container);
        },

        // Old page: fade out fast + tiny scale down + blur
        leave({ current }) {
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          const oldMain = current.container.querySelector(".page_main");
          if (!oldMain) return Promise.resolve();

          oldMain.style.willChange = "opacity, transform, filter";
          oldMain.style.pointerEvents = "none";

          return tweenPromise(oldMain, {
            opacity: 0,
            scale: 0.98,
            filter: "blur(8px)",
            duration: 0.4,
            ease: "power1.out",
            onComplete: () => {
              oldMain.style.willChange = "";
            }
          });
        },

        // New page: fade in slower + tiny scale down to 1 + unblur, with 0.1s overlap delay
        async enter({ next }) {
          const newMain = next.container.querySelector(".page_main");

          // Initialize page JS for the new container ASAP
          next.container.__cleanup = initPageScripts(next.container);

          if (!newMain) return;

          window.gsap && gsap.set(newMain, {
            opacity: 0,
            scale: 1.02,
            filter: "blur(8px)",
            willChange: "opacity, transform, filter"
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
              onComplete: () => {
                newMain.style.willChange = "";
                window.scrollTo(0, 0);
              }
            }
          );
        },
      },
    ],
  });
});
