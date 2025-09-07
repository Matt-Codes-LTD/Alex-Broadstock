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
   BOOTSTRAP (Barba + View Transitions hybrid)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  try { initCursor(); } catch (e) {}

  barba.init({
    transitions: [
      {
        name: "vt-hybrid",

        // First paint
        async once({ next }) {
          next.container.__cleanup = initPageScripts(next.container);
        },

        // Before the old container is removed
        async leave({ current }) {
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
        },

        // Swap + init new container
        async enter({ next }) {
          const doSwap = () => {
            const oldEl = document.querySelector(".page_main");
            const newEl = next.container;
            if (oldEl && newEl && oldEl !== newEl) {
              // Put the new container exactly where the old one was
              oldEl.replaceWith(newEl);
            }
            // Init scripts for the new page container
            newEl.__cleanup = initPageScripts(newEl);
          };

          // View Transitions API path (Chromium et al.)
          if (document.startViewTransition) {
            await document.startViewTransition(() => {
              // DOM mutation must occur inside this callback
              doSwap();
            }).finished;
          } else {
            // Fallback: quick fade out/in (no extra markup)
            await (window.gsap
              ? gsap.to(".page_main", { opacity: 0, duration: 0.22, ease: "power1.out" })
              : Promise.resolve());
            doSwap();
            await (window.gsap
              ? gsap.fromTo(".page_main", { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power1.out" })
              : Promise.resolve());
          }
        },
      },
    ],
  });
});
