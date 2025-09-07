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
   ANIMATIONS (per page)
========================= */
function initAnimations(container) {
  // Links
  const links = container.querySelectorAll(".link a");
  if (links.length) {
    gsap.to(links, {
      y: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power4.out",
      delay: 0.6,
    });
  }

  // Hero
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

  // Info
  const infoLines = container.querySelectorAll(".info p");
  if (infoLines.length) {
    const text = new SplitType(infoLines, {
      types: "lines",
      tagName: "div",
      lineClass: "line",
    });

    text.lines.forEach((line) => {
      const content = line.innerHTML;
      line.innerHTML = `<span>${content}</span>`;
    });

    gsap.set(".info p .line span", { y: 400, display: "block" });
    gsap.to(".info p .line span", {
      y: 0,
      duration: 2,
      stagger: 0.075,
      ease: "power4.out",
      delay: 0.25,
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
          container.__cleanup = initPageScripts(container);
          initAnimations(container);

          // Only one .page_main on first load → safe
          const pageMain = container.querySelector(".page_main");
          if (pageMain) pageMain.style.viewTransitionName = "pageMain";
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

            // ✅ Clear VT names first to prevent duplicates
            document.querySelectorAll(".page_main").forEach(el => {
              el.style.viewTransitionName = "";
            });

            // ✅ Assign to new page only
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
