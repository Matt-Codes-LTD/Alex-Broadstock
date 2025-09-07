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
   BOOTSTRAP (Barba + GSAP Crossfade + Scale + Overlap + Blur)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  try { initCursor(); } catch (e) {}
  initLenis();

  barba.init({
    transitions: [
      {
        name: "gsap-crossfade-scale-blur",

        async once({ next }) {
          const container = next.container;
          container.__cleanup = initPageScripts(container);
        },

        leave({ current }) {
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          const oldMain = current.container.querySelector(".page_main");
          if (oldMain) {
            // Return a GSAP promise
            return gsap.to(oldMain, {
              opacity: 0,
              scale: 0.98,
              filter: "blur(8px)",
              duration: 0.4,
              ease: "power1.out",
            }).then(); // 👈 ensures Barba waits
          }
        },

        enter({ next }) {
          const newMain = next.container.querySelector(".page_main");
          if (newMain) {
            gsap.set(newMain, { opacity: 0, scale: 1.02, filter: "blur(8px)" });

            // Return a GSAP promise
            return gsap.to(newMain, {
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              duration: 0.7,
              delay: 0.1,
              ease: "power2.out",
              onComplete: () => {
                next.container.__cleanup = initPageScripts(next.container);
                window.scrollTo(0, 0);
              },
            }).then(); // 👈 ensures Barba waits
          }
        },
      },
    ],
  });
});
