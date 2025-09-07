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
  if (lenis) {
    lenis.destroy();
  }
  lenis = new Lenis({
    autoRaf: true,
    smoothWheel: true,
  });
}

/* =========================
   ANIMATIONS (per page)
========================= */
function initAnimations(container) {
  // Example animations (replace/extend with your actual ones)
  gsap.to(container.querySelectorAll(".link a"), {
    y: 0,
    duration: 1,
    stagger: 0.1,
    ease: "power4.out",
    delay: 0.6,
  });

  const hero = container.querySelector(".hero h1");
  if (hero) {
    const heroText = new SplitType(hero, { types: "chars" });
    gsap.set(heroText.chars, { y: 400 });
    gsap.to(heroText.chars, {
      y: 0,
      duration: 1,
      stagger: 0.075,
      ease: "power4.out",
      delay: 0.6,
    });
  }
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
          // ✅ ensure page_main has a VT name
          const pageMain = container.querySelector(".page_main");
          if (pageMain) pageMain.style.viewTransitionName = "pageMain";

          container.__cleanup = initPageScripts(container);
          initAnimations(container);
        },

        async leave({ current }) {
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
        },

        async enter({ next }) {
          const doSwap = () => {
            const oldEl = document.querySelector(".page_main");
            const newEl = next.container;
            if (oldEl && newEl && oldEl !== newEl) {
              oldEl.replaceWith(newEl);
            }
            // ✅ add VT name again to new content
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

          initAnimations(next.container);
          window.scrollTo(0, 0);
        },
      },
    ],
  });
});
