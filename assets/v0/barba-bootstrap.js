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
   BOOTSTRAP (Barba + GSAP Fade)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  try { initCursor(); } catch (e) {}
  initLenis();

  barba.init({
    transitions: [
      {
        name: "gsap-fade",

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
            await gsap.to(oldMain, {
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
            await gsap.to(newMain, {
              opacity: 1,
              duration: 0.4,
              ease: "power1.inOut",
            });
          }

          next.container.__cleanup = initPageScripts(next.container);
          window.scrollTo(0, 0);
        },
      },
    ],
  });
});
