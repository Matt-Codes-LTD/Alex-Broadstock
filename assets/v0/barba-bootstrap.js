/* =========================
   HELPERS
========================= */
function tweenPromise(target, vars) {
  return new Promise((resolve) => {
    gsap.to(target, { ...vars, onComplete: resolve });
  });
}

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
   BARBA BOOTSTRAP
========================= */
document.addEventListener("DOMContentLoaded", () => {
  barba.init({
    transitions: [
      {
        name: "fade-scale",
        async once({ next }) {
          const main = next.container.querySelector(".page_main");
          if (main) {
            // Start visible
            gsap.set(main, { opacity: 1, scale: 1 });
            initPageScripts(next.container);
          }
        },
        async leave({ current }) {
          const oldMain = current.container.querySelector(".page_main");
          if (oldMain) {
            await tweenPromise(oldMain, {
              opacity: 0,
              scale: 0.98,
              duration: 0.4,
              ease: "power2.inOut",
            });
          }
        },
        async enter({ next }) {
          const newMain = next.container.querySelector(".page_main");
          if (newMain) {
            gsap.set(newMain, { opacity: 0, scale: 0.98 });
            await tweenPromise(newMain, {
              opacity: 1,
              scale: 1,
              duration: 0.8,
              ease: "power2.out",
            });
            initPageScripts(next.container);
          }
        },
      },
    ],
  });
});
