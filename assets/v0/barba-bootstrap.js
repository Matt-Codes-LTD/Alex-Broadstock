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

          const pageMain = container.querySelector(".page_main");
          if (pageMain) pageMain.style.viewTransitionName = "pageMain";
        },

        async leave({ current }) {
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }

          // 🟢 Clear VT name from old container before new one is injected
          const oldPageMain = current.container.querySelector(".page_main");
          if (oldPageMain) oldPageMain.style.viewTransitionName = "";
        },

        async enter({ next }) {
          const doSwap = () => {
            const oldEl = document.querySelector(".page_main");
            const newEl = next.container;

            if (oldEl && newEl && oldEl !== newEl) {
              oldEl.replaceWith(newEl);
            }

            // ✅ Assign VT name to new page only
            const pageMain = newEl.querySelector(".page_main");
            if (pageMain) pageMain.style.viewTransitionName = "pageMain";

            newEl.__cleanup = initPageScripts(newEl);
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
