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
   BOOTSTRAP (Barba + GSAP)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  try { initCursor(); } catch (e) {}
  initLenis();

  barba.init({
    transitions: [
      {
        name: "gsap-slide",

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
              y: "-100%",
              opacity: 0.8,
              duration: 0.9,
              ease: "cubic-bezier(0.76, 0, 0.24, 1)",
            });
          }
        },

        async enter({ next }) {
          const newMain = next.container.querySelector(".page_main");
          if (newMain) {
            gsap.set(newMain, { y: "100%", opacity: 0.8 });
            await gsap.to(newMain, {
              y: "0%",
              opacity: 1,
              duration: 0.9,
              ease: "cubic-bezier(0.76, 0, 0.24, 1)",
            });
          }

          next.container.__cleanup = initPageScripts(next.container);
          window.scrollTo(0, 0);
        },
      },
    ],
  });
});
