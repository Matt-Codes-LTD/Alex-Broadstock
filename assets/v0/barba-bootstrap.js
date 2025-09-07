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
   BOOTSTRAP (Barba + View Transitions)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  try { initCursor(); } catch (e) {}
  initLenis();

  barba.init({
    transitions: [
      {
        name: "vt-hybrid",

        async once({ next }) {
          const container = next.container;
          container.__cleanup = initPageScripts(container);

          // ✅ VT name on Barba container only
          container.style.viewTransitionName = "pageMain";
        },

        async leave({ current }) {
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          // 🟢 Clear VT name from old container before new one is injected
          current.container.style.viewTransitionName = "";
        },

        async enter({ next }) {
          const doSwap = () => {
            const oldContainer = document.querySelector('[data-barba="container"]');
            const newContainer = next.container;

            if (oldContainer && newContainer && oldContainer !== newContainer) {
              oldContainer.replaceWith(newContainer);
            }

            // ✅ Apply VT name only to the new container
            newContainer.style.viewTransitionName = "pageMain";
            newContainer.__cleanup = initPageScripts(newContainer);
          };

          if (document.startViewTransition) {
            await document.startViewTransition(() => {
              doSwap();
            }).finished;
          } else {
            // fallback fade
            await (window.gsap
              ? gsap.to(".page_main", { opacity: 0, duration: 0.22 })
              : Promise.resolve());
            doSwap();
            await (window.gsap
              ? gsap.fromTo(".page_main", { opacity: 0 }, { opacity: 1, duration: 0.22 })
              : Promise.resolve());
          }

          window.scrollTo(0, 0);
        },
      },
    ],
  });
});
