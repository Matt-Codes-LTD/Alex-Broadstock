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
  lenis = new Lenis({
    autoRaf: true,
    smoothWheel: true,
  });
}

/* =========================
   BOOTSTRAP (Barba + GSAP Asym Crossfade)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  try { initCursor(); } catch (e) {}
  initLenis();

  barba.init({
    transitions: [
      {
        name: "gsap-asym-crossfade",

        async once({ next }) {
          const container = next.container;
          container.__cleanup = initPageScripts(container);
        },

        async leave({ current }) {
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          const oldMain = current.container.querySelector(".page_main");
          if (oldMain) {
            // fade out faster
            return gsap.to(oldMain, {
              opacity: 0,
              duration: 0.4,
              ease: "power1.out",
            });
          }
        },

        async enter({ next }) {
          const newMain = next.container.querySelector(".page_main");
          if (newMain) {
            gsap.set(newMain, { opacity: 0 });
            // fade in slower for smoother takeover
            await gsap.to(newMain, {
              opacity: 1,
              duration: 0.7,
              ease: "power2.out",
            });
          }

          next.container.__cleanup = initPageScripts(next.container);
          window.scrollTo(0, 0);
        },
      },
    ],
  });
});
